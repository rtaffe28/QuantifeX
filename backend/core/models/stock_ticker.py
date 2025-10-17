from django.db import models

class StockTicker(models.Model):
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.symbol} - {self.name}"