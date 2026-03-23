import math
import yfinance as yf
from datetime import date, timedelta, timezone, datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Watchlist


def _safe_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def _fetch_ticker_earnings(symbol, today, cutoff):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info or {}

        company_name = info.get("shortName") or info.get("longName") or symbol

        cal = ticker.calendar
        if not cal:
            return None

        earnings_dates = cal.get("Earnings Date")
        if not earnings_dates:
            return None

        if not isinstance(earnings_dates, list):
            earnings_dates = [earnings_dates]

        target_date = None
        for ed in earnings_dates:
            if hasattr(ed, "date"):
                ed = ed.date()
            if isinstance(ed, date) and today <= ed <= cutoff:
                target_date = ed
                break

        if target_date is None:
            return None

        days_until = (target_date - today).days

        # yfinance doesn't reliably provide BMO/AMC in calendar; default N/A
        earnings_time = "N/A"

        eps_estimate = _safe_float(info.get("forwardEps") or info.get("epsForwardOneFY"))

        eps_previous = None
        try:
            eh = ticker.earnings_history
            if eh is not None and not eh.empty:
                last_row = eh.iloc[-1]
                eps_previous = _safe_float(last_row.get("epsActual"))
        except Exception:
            pass

        revenue_estimate = _safe_float(info.get("revenueEstimate") or info.get("totalRevenue"))

        return {
            "ticker": symbol.upper(),
            "company_name": company_name,
            "earnings_date": str(target_date),
            "earnings_time": earnings_time,
            "eps_estimate": eps_estimate,
            "eps_previous": eps_previous,
            "revenue_estimate": revenue_estimate,
            "days_until": days_until,
        }
    except Exception as e:
        print(f"[EarningsCalendar] Error fetching {symbol}: {e}")
        return None


class EarningsCalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickers_param = request.query_params.get("tickers", "").strip()
        days_ahead_param = request.query_params.get("days_ahead", "90")

        try:
            days_ahead = int(days_ahead_param)
        except (ValueError, TypeError):
            days_ahead = 90
        days_ahead = min(max(days_ahead, 1), 180)

        if tickers_param:
            symbols = [t.strip().upper() for t in tickers_param.split(",") if t.strip()]
        else:
            watchlist_qs = Watchlist.objects.filter(user=request.user).values_list("ticker", flat=True)
            symbols = [t.upper() for t in watchlist_qs]

        symbols = symbols[:20]

        if not symbols:
            return Response({
                "events": [],
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            })

        today = date.today()
        cutoff = today + timedelta(days=days_ahead)

        events = []
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {executor.submit(_fetch_ticker_earnings, sym, today, cutoff): sym for sym in symbols}
            for future in as_completed(futures):
                result = future.result()
                if result is not None:
                    events.append(result)

        events.sort(key=lambda e: e["earnings_date"])

        return Response({
            "events": events,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        })
