
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("posts/", include("blog.urls")),
    path("products/", include("market.urls")),
    path("inbox/", include("messages.urls")),
    
]
