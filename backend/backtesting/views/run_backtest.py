from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ..serializers import BacktestRunCreateSerializer, BacktestRunSerializer
from ..models import BacktestRun


class RunBacktestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BacktestRunCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        run = serializer.save(user=request.user)

        try:
            from ..tasks import execute_backtest
            execute_backtest.delay(run.id)
        except Exception:
            # Celery not available — run synchronously
            from ..tasks import execute_backtest
            execute_backtest(run.id)

        return Response(BacktestRunSerializer(run).data, status=status.HTTP_202_ACCEPTED)
