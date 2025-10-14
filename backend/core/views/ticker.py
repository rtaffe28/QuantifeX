from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import yfinance as yf
import json
from concurrent.futures import ThreadPoolExecutor

class TickerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        indexes = ["^GSPC", "^NDX", "^DJI"]
        symbols = set()

        for idx in indexes:
            try:
                tickers = yf.Ticker(idx).constituents
                if tickers:
                    symbols.update(tickers.keys())
            except Exception:
                continue

        symbols = sorted(list(symbols))

        def get_name(symbol):
            try:
                info = yf.Ticker(symbol).info
                return {
                    "symbol": symbol,
                    "name": info.get("shortName") or symbol,
                }
            except Exception:
                return {"symbol": symbol, "name": symbol}

        results = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            for res in executor.map(get_name, symbols):
                results.append(res)

        return Response(results)
