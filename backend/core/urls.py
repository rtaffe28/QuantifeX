from django.urls import path
from . import views

urlpatterns = [
    path('tickers/', views.StockTickerView.as_view()),
    path('watchlist/', views.WatchlistCreate.as_view()),
    path('watchlist/delete/<int:pk>/', views.WatchlistDelete.as_view())
]