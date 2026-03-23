from django.db import models
from django.contrib.auth.models import User


class BacktestRun(models.Model):
    STATUS_PENDING = "pending"
    STATUS_RUNNING = "running"
    STATUS_COMPLETE = "complete"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETE, "Complete"),
        (STATUS_FAILED, "Failed"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="backtest_runs")
    ticker = models.CharField(max_length=10)
    strategy = models.CharField(max_length=50)
    parameters = models.JSONField(default=dict)
    start_date = models.DateField()
    end_date = models.DateField()
    initial_capital = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} | {self.ticker} | {self.strategy} | {self.status}"


class BacktestResult(models.Model):
    run = models.OneToOneField(BacktestRun, on_delete=models.CASCADE, related_name="result")
    total_return_pct = models.FloatField()
    annualized_return_pct = models.FloatField(null=True, blank=True)
    max_drawdown_pct = models.FloatField()
    sharpe_ratio = models.FloatField()
    total_trades = models.IntegerField()
    final_portfolio_value = models.FloatField()
    equity_curve = models.JSONField()
    trade_log = models.JSONField()
    completed_at = models.DateTimeField(auto_now_add=True)
