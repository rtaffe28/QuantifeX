from django.urls import path
from . import views

urlpatterns = [
    # path("docs/", )
    path("watchlist/", views.watchlist)
]   