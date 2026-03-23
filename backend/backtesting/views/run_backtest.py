from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ..serializers import BacktestRunCreateSerializer, BacktestRunSerializer
from ..tasks import execute_backtest


class RunBacktestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BacktestRunCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        run = serializer.save(user=request.user)
        execute_backtest.delay(run.id)

        # Re-fetch so the response reflects any status update from eager execution
        run.refresh_from_db()
        return Response(BacktestRunSerializer(run).data, status=status.HTTP_202_ACCEPTED)
