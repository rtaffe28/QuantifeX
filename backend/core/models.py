from django.db import models

# Create your models here.
class Watchlist(models.Model):
    ticker = models.CharField(max_length=5)