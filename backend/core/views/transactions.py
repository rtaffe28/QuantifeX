from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..serializers import TransactionsSerializer
from ..models import Transactions

class TransactionsList(generics.ListCreateAPIView):
    serializer_class = TransactionsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Transactions.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionsDelete(generics.DestroyAPIView):
    serializer_class = TransactionsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Transactions.objects.filter(user=user)
