
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (MyTokenObtainPairView, 
                         LogoutAndBlacklistRefreshTokenForUserView, 
                         MyTokenRefreshCookieView,
                         RequestPasswordResetView,
                         ResetPasswordConfirmView)

urlpatterns = [
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("token/refresh/", MyTokenRefreshCookieView.as_view(), name='token_refresh'),
    path('logout/', LogoutAndBlacklistRefreshTokenForUserView.as_view()),
    
    path("password-reset/", RequestPasswordResetView.as_view(), name="password-reset"),
    path("password-reset-confirm/<uidb64>/<token>/", ResetPasswordConfirmView.as_view(), name="password-reset-confirm"),
    
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/posts/", include("blog.urls")),
    path("api/products/", include("market.urls")),
    path("api/inbox/", include("chat.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/info/", include("info.urls")),
    
]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


