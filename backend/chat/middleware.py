from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        user = User.objects.get(id=user_id)
        print(f"[JWTAuthMiddleware] get_user: Found user {user.username} (ID: {user_id})")
        return user
    except User.DoesNotExist:
        print(f"[JWTAuthMiddleware] get_user: User ID {user_id} does not exist, returning AnonymousUser")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        print("[JWTAuthMiddleware] __call__ invoked")
        scope['user'] = AnonymousUser()
        token = None

        # read cookies
        print(f"[JWTAuthMiddleware] Checking headers for cookies: {scope.get('headers')}")
        for name, value in scope.get('headers', []):
            if name == b'cookie':
                cookies = dict(
                    cookie.strip().split('=', 1)
                    for cookie in value.decode().split(';')
                    if '=' in cookie
                )
                token = cookies.get('access_token')
                print(f"[JWTAuthMiddleware] Token from cookie: {token}")
                break

        # fallback to query string
        if not token and scope.get('query_string'):
            qs = scope['query_string'].decode()
            params = parse_qs(qs)
            token = params.get('token', [None])[0]
            print(f"[JWTAuthMiddleware] Token from query string: {token}")

        if token:
            try:
                access_token = AccessToken(token)  # validates + ensures it's access token
                payload = access_token.payload
                print(f"[JWTAuthMiddleware] AccessToken payload: {payload}")
                user = await get_user(payload['user_id'])
                scope['user'] = user
                print(f"[JWTAuthMiddleware] Authenticated user set in scope: {user}")
            except Exception as e:
                scope['user'] = AnonymousUser()
                print(f"[JWTAuthMiddleware] Failed to authenticate token: {e}")
        else:
            print("[JWTAuthMiddleware] No token found, using AnonymousUser")

        return await super().__call__(scope, receive, send)
