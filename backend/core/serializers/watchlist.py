from rest_framework import serializers
from core.models import Watchlist

class WatchlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Watchlist
        fields = ['id', 'user', 'ticker']
        extra_kwargs = {'user': {'read_only': True}}
        
