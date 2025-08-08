from chat.routing import websocket_urlpatterns as chat_routes
from notifications.routing import websocket_urlpatterns as notification_routes

websocket_urlpatterns = chat_routes + notification_routes
