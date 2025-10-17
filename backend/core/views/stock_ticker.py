from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import StockTicker
from core.serializers import StockTickerSerializer

class StockTickerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickers = StockTicker.objects.all()
        serializer = StockTickerSerializer(tickers, many=True)
        return Response(serializer.data)