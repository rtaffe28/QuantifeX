from django.db import models
from django.conf import settings

# Create your models here.
class Stock(models.Model):
    symbol = models.CharField(max_length=10, unique=True)
    company_name = models.CharField(max_length=100)
    current_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.symbol

class PortfolioStock(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolio_stocks",
    )
    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name="portfolio_holdings",
    )
    shares = models.DecimalField(max_digits=12, decimal_places=4)
    purchasecost = models.DecimalField(max_digits=16, decimal_places=6)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "stock")

    def __str__(self):
        return f"{self.user} - {self.stock.symbol}"
