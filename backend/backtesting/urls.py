from django.urls import path
from . import views

urlpatterns = [
    path("strategies/", views.StrategiesView.as_view(), name="backtest-strategies"),
    path("run/", views.RunBacktestView.as_view(), name="backtest-run"),
    path("runs/", views.BacktestRunListView.as_view(), name="backtest-runs"),
    path("runs/<int:pk>/", views.BacktestRunDetailView.as_view(), name="backtest-run-detail"),
]
