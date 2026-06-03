
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (MyTokenObtainPairView, 
                         LogoutAndBlacklistRefreshTokenForUserView, 
                         MyTokenRefreshCookieView,
                         RequestPasswordResetView,
                         ResetPasswordConfirmView,
                         DeactivateAccountView, 
                         DeleteAccountView)

urlpatterns = [
    path('api/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("api/token/refresh/", MyTokenRefreshCookieView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutAndBlacklistRefreshTokenForUserView.as_view()),
    
    path("api/password-reset/", RequestPasswordResetView.as_view(), name="password-reset"),
    path("password-reset-confirm/<uidb64>/<token>/", ResetPasswordConfirmView.as_view(), name="password-reset-confirm"),
    
    path("api/deactivate-account/", DeactivateAccountView.as_view()),
    path("api/delete-account/", DeleteAccountView.as_view()),
    
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/posts/", include("blog.urls")),
    path("api/products/", include("market.urls")),
    path("api/inbox/", include("chat.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/articles/", include("info.urls")),
    path("api/", include("follows.urls")),
    
]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


