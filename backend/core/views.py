from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import Watchlist
from .serializers import WatchlistSerializer
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
# Create your views here.

@require_POST
def login_view(request):
    username = request.POST.get("username")
    password = request.POST.get("password")
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({"message": "Login successful"})
    else:
        return JsonResponse({"message": "Invalid credentials"}, status=401)

def logout_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "User not logged in"}, status=401)
    logout(request)
    return JsonResponse({"message": "Logout successful"})

def ensure_crsf_cookie(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "User not logged in"}, status=401)
    return JsonResponse({"message": "CSRF cookie set"})

def whoami(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "User not logged in"}, status=401)
    return JsonResponse({"username": request.user.username})

@api_view(["GET", "POST", "PUT", "DELETE"])
def watchlist(request):

    if request.method == "GET":
        watchlist = Watchlist.objects.all()
        serializer = WatchlistSerializer(watchlist, many=True)
        return JsonResponse({"watchlist": serializer.data})
    
    if request.method == "POST":
        serializer = WatchlistSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    if request.method == "PUT":
        watchlist = Watchlist.objects.all()
        serializer = WatchlistSerializer(watchlist, many=True)
        return JsonResponse({"watchlist": serializer.data})
    
    if request.method == "DELETE":
        watchlist = Watchlist.objects.all()
        serializer = WatchlistSerializer(watchlist, many=True)
        return JsonResponse({"watchlist": serializer.data})