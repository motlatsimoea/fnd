import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django

django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from backend.routing import websocket_urlpatterns
from chat.middleware import JWTAuthMiddleware




application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})
