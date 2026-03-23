import numpy as np
import yfinance as yf
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

TRADING_DAYS = 252
BATCH_SIZE = 500


class MonteCarloView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        holdings = data.get("holdings", [])
        initial_value = float(data.get("initial_value", 10000))
        monthly_contribution = float(data.get("monthly_contribution", 0))
        years = int(data.get("years", 20))
        simulations = int(data.get("simulations", 1000))
        historical_period = data.get("historical_period", "10y")
        risk_free_rate = float(data.get("risk_free_rate", 0.05))

        errors = _validate(holdings, initial_value, years, simulations, historical_period)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        tickers = [h["ticker"].upper() for h in holdings]
        weights = np.array([float(h["weight"]) for h in holdings])

        try:
            portfolio_daily_returns = _fetch_portfolio_returns(tickers, weights, historical_period)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to fetch market data: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        annual_values = _run_simulations(
            portfolio_daily_returns, initial_value, monthly_contribution,
            years, simulations
        )

        final_values = annual_values[:, -1]
        time_labels = [f"Year {i}" for i in range(years + 1)]

        ann_return = float(np.mean(portfolio_daily_returns) * TRADING_DAYS)
        ann_vol = float(np.std(portfolio_daily_returns) * np.sqrt(TRADING_DAYS))

        return Response({
            "years": years,
            "initial_value": initial_value,
            "percentiles": {
                "p10": _pct(annual_values, 10),
                "p25": _pct(annual_values, 25),
                "p50": _pct(annual_values, 50),
                "p75": _pct(annual_values, 75),
                "p90": _pct(annual_values, 90),
            },
            "time_labels": time_labels,
            "stats": {
                "median_final": round(float(np.median(final_values)), 2),
                "mean_final": round(float(np.mean(final_values)), 2),
                "p10_final": round(float(np.percentile(final_values, 10)), 2),
                "p90_final": round(float(np.percentile(final_values, 90)), 2),
                "prob_double": round(float(np.mean(final_values >= initial_value * 2)), 4),
                "prob_triple": round(float(np.mean(final_values >= initial_value * 3)), 4),
                "prob_loss": round(float(np.mean(final_values < initial_value)), 4),
                "expected_annual_return": round(ann_return, 4),
                "portfolio_volatility": round(ann_vol, 4),
            },
        })


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate(holdings, initial_value, years, simulations, historical_period):
    errors = {}
    if not holdings or len(holdings) < 1:
        errors["holdings"] = "At least one holding is required."
    elif len(holdings) > 15:
        errors["holdings"] = "Maximum 15 holdings allowed."
    else:
        total_weight = sum(float(h.get("weight", 0)) for h in holdings)
        if abs(total_weight - 1.0) > 0.015:
            errors["weights"] = f"Weights must sum to 1.0 (got {total_weight:.3f})."
    if initial_value <= 0:
        errors["initial_value"] = "Initial value must be positive."
    if not (1 <= years <= 50):
        errors["years"] = "Years must be between 1 and 50."
    if not (100 <= simulations <= 5000):
        errors["simulations"] = "Simulations must be between 100 and 5000."
    if historical_period not in {"3y", "5y", "10y", "max"}:
        errors["historical_period"] = "Must be one of: 3y, 5y, 10y, max."
    return errors


def _fetch_portfolio_returns(tickers, weights, period):
    raw = yf.download(tickers, period=period, auto_adjust=True, progress=False)
    closes = raw["Close"] if len(tickers) > 1 else raw[["Close"]].rename(columns={"Close": tickers[0]})

    # Keep only columns we asked for (yfinance may reorder)
    closes = closes[[t for t in tickers if t in closes.columns]].dropna()

    if len(closes) < 252:
        raise ValueError(
            "Insufficient historical data (need at least 252 trading days). "
            "Try a longer period or check ticker symbols."
        )

    daily_log_returns = np.log(closes / closes.shift(1)).dropna().values  # (days, n_tickers)
    portfolio_returns = daily_log_returns @ weights  # (days,)
    return portfolio_returns


def _run_simulations(portfolio_returns, initial_value, monthly_contribution, years, simulations):
    n_hist = len(portfolio_returns)
    annual_contribution = 12 * monthly_contribution

    annual_values = np.zeros((simulations, years + 1))
    annual_values[:, 0] = initial_value

    for batch_start in range(0, simulations, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, simulations)
        batch = batch_end - batch_start

        # Sample random indices: (batch, years, TRADING_DAYS)
        idx = np.random.randint(0, n_hist, size=(batch, years, TRADING_DAYS))
        samples = portfolio_returns[idx]  # (batch, years, TRADING_DAYS)

        # Annual growth factors: (batch, years)
        annual_growth = np.exp(np.sum(samples, axis=2))

        for yr in range(years):
            annual_values[batch_start:batch_end, yr + 1] = (
                annual_values[batch_start:batch_end, yr] * annual_growth[:, yr]
                + annual_contribution
            )

    return annual_values


def _pct(matrix, q):
    return [round(float(v), 2) for v in np.percentile(matrix, q, axis=0)]
