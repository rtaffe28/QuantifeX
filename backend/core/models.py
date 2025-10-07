from django.db import models
from django.contrib.auth.models import User

class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watchlist")
    ticker = models.CharField(max_length=5)

    def __str__(self):
        return self.ticker