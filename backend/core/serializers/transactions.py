from rest_framework import serializers
from core.models import Transactions

class TransactionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transactions
        fields = ['id', 'user', 'date', 'type', 'description', 'amount']
        extra_kwargs = {'user': {'read_only': True}}
