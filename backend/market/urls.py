from django.urls import path
from .views import ProductCreateView, ReviewListCreateView, ProductDetailView

urlpatterns = [
    path("", ProductCreateView.as_view(), name='product-create'),
    path("<uuid:pk>/", ProductDetailView.as_view(), name='product-detail'),
    path("products/<uuid:product_id>/reviews/", ReviewListCreateView.as_view(), name='review-list-create'),
]