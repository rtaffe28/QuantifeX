from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import BacktestRun
from ..serializers import BacktestRunSerializer


class BacktestRunListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BacktestRunSerializer

    def get_queryset(self):
        return BacktestRun.objects.filter(user=self.request.user).order_by("-created_at")


class BacktestRunDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BacktestRunSerializer

    def get_queryset(self):
        return BacktestRun.objects.filter(user=self.request.user)
