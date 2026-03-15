import yfinance as yf
import numpy as np
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class StockDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        try:
            ticker = yf.Ticker(symbol.upper())
            info = ticker.info or {}

            if not info.get("shortName") and not info.get("longName"):
                return Response({"error": "Ticker not found"}, status=404)

            # Price history — accept ?period= param (default 1y)
            allowed_periods = {"1mo", "3mo", "6mo", "1y", "5y", "max"}
            period = request.query_params.get("period", "1y")
            if period not in allowed_periods:
                period = "1y"
            hist = ticker.history(period=period)
            price_history = []
            for date, row in hist.iterrows():
                price_history.append({
                    "date": str(date.date()),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"]),
                })

            # Volatility from daily returns
            std_dev_30d = None
            std_dev_90d = None
            if len(hist) > 1:
                returns = hist["Close"].pct_change().dropna()
                if len(returns) >= 30:
                    std_dev_30d = round(float(returns.tail(30).std()), 4)
                if len(returns) >= 90:
                    std_dev_90d = round(float(returns.tail(90).std()), 4)

            # Earnings history (quarterly EPS)
            earnings = []
            try:
                eh = ticker.earnings_history
                if eh is not None and not eh.empty:
                    for quarter, row in eh.iterrows():
                        q_date = quarter.date() if hasattr(quarter, 'date') else quarter
                        q_num = (q_date.month - 1) // 3 + 1 if hasattr(q_date, 'month') else None
                        label = f"Q{q_num} {q_date.year}" if q_num else str(q_date)
                        earnings.append({
                            "quarter": label,
                            "actual_eps": _safe_float(row.get("epsActual")),
                            "estimated_eps": _safe_float(row.get("epsEstimate")),
                        })
            except Exception as e:
                print(f"[StockDetail] earnings_history error for {symbol}: {e}")

            # Annual financials (revenue & net income)
            annual_financials = []
            try:
                inc = ticker.income_stmt
                if inc is not None and not inc.empty:
                    for col in reversed(inc.columns):
                        revenue = _safe_float(inc.loc["Total Revenue", col]) if "Total Revenue" in inc.index else None
                        net_income = _safe_float(inc.loc["Net Income", col]) if "Net Income" in inc.index else None
                        if revenue is not None or net_income is not None:
                            annual_financials.append({
                                "period": str(col.date()),
                                "revenue": revenue,
                                "net_income": net_income,
                            })
            except Exception:
                pass

            # Quarterly financials (revenue & net income)
            quarterly_financials = []
            try:
                qinc = ticker.quarterly_income_stmt
                if qinc is not None and not qinc.empty:
                    for col in reversed(qinc.columns):
                        revenue = _safe_float(qinc.loc["Total Revenue", col]) if "Total Revenue" in qinc.index else None
                        net_income = _safe_float(qinc.loc["Net Income", col]) if "Net Income" in qinc.index else None
                        if revenue is not None or net_income is not None:
                            quarterly_financials.append({
                                "period": str(col.date()),
                                "revenue": revenue,
                                "net_income": net_income,
                            })
            except Exception:
                pass

            data = {
                "symbol": symbol.upper(),
                "name": info.get("shortName") or info.get("longName"),
                "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "change_today": info.get("regularMarketChange"),
                "change_today_pct": info.get("regularMarketChangePercent"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "dividend_yield": info.get("dividendYield"),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
                "price_history": price_history,
                "earnings": earnings,
                "annual_financials": annual_financials,
                "quarterly_financials": quarterly_financials,
                "volatility": {
                    "beta": info.get("beta"),
                    "std_dev_30d": std_dev_30d,
                    "std_dev_90d": std_dev_90d,
                },
            }

            return Response(data)

        except Exception as e:
            return Response(
                {"error": f"Failed to fetch stock data: {str(e)}"},
                status=500,
            )


def _safe_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        if np.isnan(f):
            return None
        return f
    except (TypeError, ValueError):
        return None
