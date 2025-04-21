
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("posts/", include("blog.urls")),
    path("products/", include("market.urls")),
    path("inbox/", include("chat.urls")),
    path("notifications/", include("notifications.urls")),
    path("info/", include("info.urls")),
    
]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


