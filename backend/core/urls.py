from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login_view),
    path("logout/", views.logout_view),
    path("session/", views.ensure_crsf_cookie),
    path("whoami/", views.whoami),
    path("watchlist/", views.watchlist)
]   