from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from .consumers import ChatConsumer, InboxConsumer

# WebSocket URL patterns
websocket_urlpatterns = [
    path('ws/chat/<str:unique_key>/', ChatConsumer.as_asgi()),
    path('ws/inbox/', InboxConsumer.as_asgi()),
]

