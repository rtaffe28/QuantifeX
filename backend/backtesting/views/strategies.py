from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

STRATEGIES = [
    {
        "id": "buy_and_hold",
        "name": "Buy & Hold",
        "description": "Buys the stock on the first trading day and holds until the end date.",
        "parameters": [],
    },
    {
        "id": "sma_crossover",
        "name": "SMA Crossover",
        "description": "Buys on a golden cross (short SMA above long SMA) and sells on a death cross.",
        "parameters": [
            {"key": "short_window", "label": "Short Window (days)", "type": "number", "default": 50},
            {"key": "long_window", "label": "Long Window (days)", "type": "number", "default": 200},
        ],
    },
    {
        "id": "covered_call",
        "name": "Covered Call",
        "description": "Buys stock then sells OTM call options to generate premium income.",
        "parameters": [
            {"key": "strike_factor", "label": "Strike Factor (e.g. 1.06 = 6% OTM)", "type": "number", "default": 1.06},
            {"key": "interest_rate", "label": "Risk-Free Rate", "type": "number", "default": 0.05},
        ],
    },
    {
        "id": "leap",
        "name": "LEAP Strategy",
        "description": "Buys long-dated call options as a leveraged equity substitute.",
        "parameters": [
            {"key": "strike_factor", "label": "Strike Factor (e.g. 1.1 = 10% OTM)", "type": "number", "default": 1.1},
            {"key": "days", "label": "Days to Expiry", "type": "number", "default": 365},
            {"key": "interest_rate", "label": "Risk-Free Rate", "type": "number", "default": 0.05},
        ],
    },
    {
        "id": "wheel",
        "name": "Wheel Strategy",
        "description": "Sells cash-secured puts, then transitions to covered calls on assignment.",
        "parameters": [
            {"key": "put_strike_factor", "label": "Put Strike Factor (e.g. 0.95 = 5% OTM)", "type": "number", "default": 0.95},
            {"key": "call_strike_factor", "label": "Call Strike Factor (e.g. 1.05 = 5% OTM)", "type": "number", "default": 1.05},
            {"key": "days_to_expiration", "label": "Days to Expiration", "type": "number", "default": 30},
            {"key": "interest_rate", "label": "Risk-Free Rate", "type": "number", "default": 0.05},
        ],
    },
]


class StrategiesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(STRATEGIES)
