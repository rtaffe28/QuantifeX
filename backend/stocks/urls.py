from django.urls import path
from . import views

urlpatterns = [
    path('stocks/', views.stocks_list),
    path('stocks/<int:stock_id>/', views.stock_detail),

    path("auth/register/", views.register_user),
    path("auth/login/", views.login_user),
    path("auth/logout/", views.logout_user),
    path("auth/me/", views.current_user),

    path("portfolio-stocks/", views.portfolio_stocks_list),
    path("portfolio-stocks/<int:portfolio_stock_id>/", views.portfolio_stock_detail),
]
