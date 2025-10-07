from django.urls import path
from . import views

urlpatterns = [
    path('watchlist/add', views.WatchlistCreate.as_view()),
    path('watchlist/delete/<int:pk>', views.WatchlistDelete.as_view())
]