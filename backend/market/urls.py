from django.urls import path
from .views import (ProductCreateView, 
                    ReviewListCreateView, 
                    ProductDetailView, 
                    ReviewRetrieveUpdateDestroyView,
                    ProductImageListCreateView
                    )

urlpatterns = [
    path("", ProductCreateView.as_view(), name='product-create'),
    path("<uuid:pk>/", ProductDetailView.as_view(), name='product-detail'),
    path("<uuid:product_id>/reviews/", ReviewListCreateView.as_view(), name='review-list-create'),
    path("reviews/<int:pk>/", ReviewRetrieveUpdateDestroyView.as_view(), name="review-detail"),
    path("<uuid:product_id>/images/", ProductImageListCreateView.as_view(), name='product-image-list-create'),
]