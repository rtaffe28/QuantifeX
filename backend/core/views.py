from django.shortcuts import render
from django.http import JsonResponse
from .models import Watchlist
from .serializers import WatchlistSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
# Create your views here.

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