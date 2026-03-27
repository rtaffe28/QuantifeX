import math
import numpy as np
from scipy.stats import norm
import yfinance as yf
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status


class OptionsPriceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        params = request.query_params

        option_type = params.get("option_type", "").lower()
        if option_type not in ("call", "put"):
            return Response(
                {"option_type": "Must be 'call' or 'put'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        symbol = params.get("symbol", "").upper() or None

        try:
            spot = float(params["spot"]) if "spot" in params else None
            strike = float(params["strike"]) if "strike" in params else None
            expiry_days = int(params["expiry_days"]) if "expiry_days" in params else None
            iv = float(params["iv"]) if "iv" in params else None
            rate = float(params.get("rate", 0.05))
        except (ValueError, TypeError) as e:
            return Response({"error": f"Invalid parameter: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        # Auto-fill spot / iv from yfinance if symbol provided and values missing
        if symbol and (spot is None or iv is None):
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="1y")
                if spot is None and not hist.empty:
                    spot = float(hist["Close"].iloc[-1])
                if iv is None and len(hist) >= 20:
                    log_returns = np.log(hist["Close"] / hist["Close"].shift(1)).dropna()
                    iv = float(log_returns.std() * math.sqrt(252))
            except Exception:
                pass

        errors = _validate(spot, strike, expiry_days, iv, rate)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        result = _black_scholes(spot, strike, expiry_days, iv, rate, option_type)
        return Response(result)


def _validate(spot, strike, expiry_days, iv, rate):
    errors = {}
    if spot is None or spot <= 0:
        errors["spot"] = "Spot price must be a positive number."
    if strike is None or strike <= 0:
        errors["strike"] = "Strike price must be a positive number."
    if expiry_days is None or expiry_days <= 0:
        errors["expiry_days"] = "Expiry days must be a positive integer."
    if iv is None or iv <= 0:
        errors["iv"] = "Implied volatility must be positive."
    if rate is None or rate < 0:
        errors["rate"] = "Risk-free rate must be non-negative."
    return errors


def _black_scholes(S, K, expiry_days, sigma, r, option_type):
    T = expiry_days / 365.0

    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    pdf_d1 = norm.pdf(d1)
    discount = math.exp(-r * T)

    if option_type == "call":
        price = S * norm.cdf(d1) - K * discount * norm.cdf(d2)
        delta = norm.cdf(d1)
        theta = (
            -(S * pdf_d1 * sigma) / (2 * math.sqrt(T))
            - r * K * discount * norm.cdf(d2)
        ) / 365.0
        rho = K * T * discount * norm.cdf(d2) / 100.0
        intrinsic = max(0.0, S - K)
        breakeven = K + price
    else:
        price = K * discount * norm.cdf(-d2) - S * norm.cdf(-d1)
        delta = norm.cdf(d1) - 1.0
        theta = (
            -(S * pdf_d1 * sigma) / (2 * math.sqrt(T))
            + r * K * discount * norm.cdf(-d2)
        ) / 365.0
        rho = -K * T * discount * norm.cdf(-d2) / 100.0
        intrinsic = max(0.0, K - S)
        breakeven = K - price

    gamma = pdf_d1 / (S * sigma * math.sqrt(T))
    vega = S * pdf_d1 * math.sqrt(T) / 100.0
    time_value = price - intrinsic

    return {
        "price": round(price, 4),
        "delta": round(delta, 4),
        "gamma": round(gamma, 6),
        "theta": round(theta, 6),
        "vega": round(vega, 6),
        "rho": round(rho, 6),
        "intrinsic_value": round(intrinsic, 4),
        "time_value": round(time_value, 4),
        "breakeven": round(breakeven, 4),
    }
