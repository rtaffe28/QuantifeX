from django.urls import path
from . import views

urlpatterns = [
    path('tickers/', views.StockTickerView.as_view()),
    path('watchlist/', views.WatchlistCreate.as_view()),
    path('watchlist/delete/<int:pk>/', views.WatchlistDelete.as_view()),
    path('transactions/', views.TransactionsList.as_view()),
    path('transactions/delete/<int:pk>/', views.TransactionsDelete.as_view()),
    path('stock/<str:symbol>/', views.StockDetailView.as_view()),
    path('monte-carlo/simulate/', views.MonteCarloView.as_view()),
    path('earnings-calendar/', views.EarningsCalendarView.as_view()),
]