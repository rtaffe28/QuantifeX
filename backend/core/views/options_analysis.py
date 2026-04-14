import yfinance as yf
import numpy as np
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class OptionsAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        try:
            ticker = yf.Ticker(symbol.upper())
            info = ticker.info or {}

            if not info.get("shortName") and not info.get("longName"):
                return Response({"error": "Ticker not found"}, status=404)

            expirations = list(ticker.options)
            if not expirations:
                return Response({"error": "No options data available for this ticker"}, status=404)

            # Use requested expiration or default to first available
            selected_exp = request.query_params.get("expiration", expirations[0])
            if selected_exp not in expirations:
                selected_exp = expirations[0]

            chain = ticker.option_chain(selected_exp)
            calls_df = chain.calls
            puts_df = chain.puts

            current_price = info.get("currentPrice") or info.get("regularMarketPrice") or 0

            # --- Options chain data ---
            calls = _build_chain(calls_df, current_price)
            puts = _build_chain(puts_df, current_price)

            # --- IV Skew (strike vs IV for calls and puts) ---
            iv_skew = _build_iv_skew(calls_df, puts_df, current_price)

            # --- Put/Call ratios ---
            total_call_volume = int(calls_df["volume"].fillna(0).sum())
            total_put_volume = int(puts_df["volume"].fillna(0).sum())
            total_call_oi = int(calls_df["openInterest"].fillna(0).sum())
            total_put_oi = int(puts_df["openInterest"].fillna(0).sum())

            pc_volume_ratio = round(total_put_volume / total_call_volume, 3) if total_call_volume > 0 else None
            pc_oi_ratio = round(total_put_oi / total_call_oi, 3) if total_call_oi > 0 else None

            # --- IV vs RV (Realized Volatility) ---
            iv_rv = _build_iv_vs_rv(ticker, calls_df, puts_df, current_price)

            # --- IV Term Structure (ATM IV across expirations) ---
            term_structure = _build_term_structure(ticker, expirations, current_price)

            # --- Max Pain ---
            max_pain = _calculate_max_pain(calls_df, puts_df)

            # --- Volume/OI by strike ---
            volume_oi = _build_volume_oi_by_strike(calls_df, puts_df)

            # --- Greeks summary (ATM options) ---
            greeks = _build_greeks_summary(calls_df, puts_df, current_price)

            data = {
                "symbol": symbol.upper(),
                "name": info.get("shortName") or info.get("longName"),
                "current_price": current_price,
                "expirations": expirations,
                "selected_expiration": selected_exp,
                "days_to_expiry": _days_to_expiry(selected_exp),
                "calls": calls,
                "puts": puts,
                "iv_skew": iv_skew,
                "summary": {
                    "total_call_volume": total_call_volume,
                    "total_put_volume": total_put_volume,
                    "total_call_oi": total_call_oi,
                    "total_put_oi": total_put_oi,
                    "pc_volume_ratio": pc_volume_ratio,
                    "pc_oi_ratio": pc_oi_ratio,
                    "max_pain": max_pain,
                },
                "iv_rv": iv_rv,
                "term_structure": term_structure,
                "volume_oi_by_strike": volume_oi,
                "greeks": greeks,
            }

            return Response(data)

        except Exception as e:
            return Response(
                {"error": f"Failed to fetch options data: {str(e)}"},
                status=500,
            )


def _safe(val):
    if val is None:
        return None
    try:
        f = float(val)
        return None if np.isnan(f) else f
    except (TypeError, ValueError):
        return None


def _days_to_expiry(exp_str):
    try:
        exp_date = datetime.strptime(exp_str, "%Y-%m-%d").date()
        return max(0, (exp_date - datetime.now().date()).days)
    except Exception:
        return None


def _build_chain(df, current_price):
    rows = []
    for _, row in df.iterrows():
        strike = _safe(row.get("strike"))
        rows.append({
            "strike": strike,
            "lastPrice": _safe(row.get("lastPrice")),
            "bid": _safe(row.get("bid")),
            "ask": _safe(row.get("ask")),
            "change": _safe(row.get("change")),
            "percentChange": _safe(row.get("percentChange")),
            "volume": int(row["volume"]) if _safe(row.get("volume")) is not None else 0,
            "openInterest": int(row["openInterest"]) if _safe(row.get("openInterest")) is not None else 0,
            "impliedVolatility": _safe(row.get("impliedVolatility")),
            "inTheMoney": bool(row.get("inTheMoney", False)),
            "moneyness": round((strike / current_price - 1) * 100, 2) if strike and current_price else None,
        })
    return rows


def _build_iv_skew(calls_df, puts_df, current_price):
    """IV vs strike for both calls and puts — for skew chart."""
    skew_calls = []
    skew_puts = []

    for _, row in calls_df.iterrows():
        strike = _safe(row.get("strike"))
        iv = _safe(row.get("impliedVolatility"))
        if strike and iv and iv > 0:
            skew_calls.append({
                "strike": strike,
                "iv": round(iv * 100, 2),
                "moneyness": round((strike / current_price - 1) * 100, 2) if current_price else None,
            })

    for _, row in puts_df.iterrows():
        strike = _safe(row.get("strike"))
        iv = _safe(row.get("impliedVolatility"))
        if strike and iv and iv > 0:
            skew_puts.append({
                "strike": strike,
                "iv": round(iv * 100, 2),
                "moneyness": round((strike / current_price - 1) * 100, 2) if current_price else None,
            })

    return {"calls": skew_calls, "puts": skew_puts}


def _build_iv_vs_rv(ticker, calls_df, puts_df, current_price):
    """Compare implied volatility to realized (historical) volatility at multiple windows."""
    # ATM IV — average IV of nearest-to-money calls and puts
    atm_iv = _get_atm_iv(calls_df, puts_df, current_price)

    # Historical realized volatility at different windows
    try:
        hist = ticker.history(period="1y")
        if hist.empty or len(hist) < 30:
            return {"atm_iv": atm_iv, "rv_windows": []}

        returns = hist["Close"].pct_change().dropna()
        windows = [
            ("10d", 10),
            ("20d", 20),
            ("30d", 30),
            ("60d", 60),
            ("90d", 90),
        ]
        rv_windows = []
        for label, days in windows:
            if len(returns) >= days:
                rv = float(returns.tail(days).std()) * np.sqrt(252) * 100
                rv_windows.append({"window": label, "rv": round(rv, 2)})

        # Historical RV time series (rolling 30d) for charting
        rv_series = []
        if len(returns) >= 30:
            rolling_rv = returns.rolling(30).std() * np.sqrt(252) * 100
            rolling_rv = rolling_rv.dropna()
            for date, val in rolling_rv.items():
                rv_series.append({
                    "date": str(date.date()),
                    "rv": round(float(val), 2),
                })

        return {
            "atm_iv": atm_iv,
            "rv_windows": rv_windows,
            "rv_series": rv_series,
        }
    except Exception:
        return {"atm_iv": atm_iv, "rv_windows": [], "rv_series": []}


def _get_atm_iv(calls_df, puts_df, current_price):
    """Get the implied volatility of the nearest ATM option."""
    if current_price <= 0:
        return None
    best_iv = None
    best_dist = float("inf")
    for df in [calls_df, puts_df]:
        for _, row in df.iterrows():
            strike = _safe(row.get("strike"))
            iv = _safe(row.get("impliedVolatility"))
            if strike and iv and iv > 0:
                dist = abs(strike - current_price)
                if dist < best_dist:
                    best_dist = dist
                    best_iv = round(iv * 100, 2)
    return best_iv


def _build_term_structure(ticker, expirations, current_price):
    """ATM IV across different expirations — for term structure chart."""
    structure = []
    # Limit to first 12 expirations to keep response fast
    for exp in expirations[:12]:
        try:
            chain = ticker.option_chain(exp)
            atm_iv = _get_atm_iv(chain.calls, chain.puts, current_price)
            if atm_iv:
                dte = _days_to_expiry(exp)
                structure.append({
                    "expiration": exp,
                    "dte": dte,
                    "atm_iv": atm_iv,
                })
        except Exception:
            continue
    return structure


def _calculate_max_pain(calls_df, puts_df):
    """Find the strike at which total option holder losses are maximized."""
    strikes = sorted(set(calls_df["strike"].tolist() + puts_df["strike"].tolist()))
    if not strikes:
        return None

    call_oi = dict(zip(calls_df["strike"], calls_df["openInterest"].fillna(0)))
    put_oi = dict(zip(puts_df["strike"], puts_df["openInterest"].fillna(0)))

    min_pain = float("inf")
    max_pain_strike = None

    for target in strikes:
        total_pain = 0
        for s in strikes:
            # Call holders lose if price < strike (ITM calls lose nothing, OTM calls expire worthless)
            c_oi = call_oi.get(s, 0)
            if target > s:
                total_pain += (target - s) * c_oi * 100
            # Put holders lose if price > strike
            p_oi = put_oi.get(s, 0)
            if target < s:
                total_pain += (s - target) * p_oi * 100

        if total_pain < min_pain:
            min_pain = total_pain
            max_pain_strike = target

    return _safe(max_pain_strike)


def _build_volume_oi_by_strike(calls_df, puts_df):
    """Volume and OI by strike for both calls and puts."""
    data = []
    all_strikes = sorted(set(
        calls_df["strike"].tolist() + puts_df["strike"].tolist()
    ))
    call_vol = dict(zip(calls_df["strike"], calls_df["volume"].fillna(0)))
    call_oi = dict(zip(calls_df["strike"], calls_df["openInterest"].fillna(0)))
    put_vol = dict(zip(puts_df["strike"], puts_df["volume"].fillna(0)))
    put_oi = dict(zip(puts_df["strike"], puts_df["openInterest"].fillna(0)))

    for s in all_strikes:
        data.append({
            "strike": s,
            "callVolume": int(call_vol.get(s, 0)),
            "callOI": int(call_oi.get(s, 0)),
            "putVolume": int(put_vol.get(s, 0)),
            "putOI": int(put_oi.get(s, 0)),
        })
    return data


def _build_greeks_summary(calls_df, puts_df, current_price):
    """Extract Greeks for near-the-money options if available."""
    # yfinance doesn't always provide Greeks, but we extract what's available
    greeks_data = {"calls": [], "puts": []}

    for label, df in [("calls", calls_df), ("puts", puts_df)]:
        for _, row in df.iterrows():
            strike = _safe(row.get("strike"))
            if not strike:
                continue
            moneyness = abs(strike - current_price) / current_price if current_price else 1
            # Only include strikes within 15% of ATM
            if moneyness > 0.15:
                continue
            entry = {
                "strike": strike,
                "iv": round(_safe(row.get("impliedVolatility")) * 100, 2) if _safe(row.get("impliedVolatility")) else None,
                "volume": int(row["volume"]) if _safe(row.get("volume")) is not None else 0,
                "openInterest": int(row["openInterest"]) if _safe(row.get("openInterest")) is not None else 0,
                "bid": _safe(row.get("bid")),
                "ask": _safe(row.get("ask")),
            }
            greeks_data[label].append(entry)

    return greeks_data
