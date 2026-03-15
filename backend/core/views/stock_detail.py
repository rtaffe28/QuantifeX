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

            # Price history (1 year)
            hist = ticker.history(period="1y")
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

            # Earnings
            earnings = []
            try:
                earnings_df = ticker.quarterly_earnings
                if earnings_df is not None and not earnings_df.empty:
                    for quarter, row in earnings_df.iterrows():
                        earnings.append({
                            "quarter": str(quarter),
                            "actual_eps": row.get("Earnings", None),
                            "estimated_eps": row.get("Estimate", None),
                            "revenue": row.get("Revenue", None),
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
