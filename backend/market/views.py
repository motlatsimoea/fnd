from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Product, ProductImage, Review
from .serializers import ProductSerializer, ProductImageSerializer, ReviewSerializer
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from django.core.exceptions import PermissionDenied
from notifications.utils import send_notification



class ProductCreateView(APIView):
    """
    List all products or create a new product along with additional images.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Deserialize the data from the request
        serializer = ProductSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(seller=request.user) 
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    """
    Retrieve, update or delete a product.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != product.seller:
            raise PermissionDenied("You can only update your own product.")
        
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != product.seller:
            raise PermissionDenied("You can only delete your own product.")
        product.delete()
        return Response({"detail": "Product deleted."}, status=status.HTTP_204_NO_CONTENT)



class ProductImageListCreateView(APIView):
    """
    List all product images or add a new image.
    """
    
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request, product_id):
        product = Product.objects.get(pk=product_id)
        images = product.additional_images.all()
        serializer = ProductImageSerializer(images, many=True)
        return Response(serializer.data)

    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        serializer = ProductImageSerializer(data=request.data, context={'product': product})
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ReviewListCreateView(APIView):
    """
    List all reviews for a product or create a new review.
    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        reviews = product.reviews.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            parent = serializer.validated_data.get('parent', None)
            review = serializer.save(product=product, author=request.user)

            if parent:
                try:
                    parent_review = Review.objects.get(pk=parent.pk)
                    if parent_review.author != request.user:
                        send_notification(
                            user=parent_review.author,
                            sender=request.user,
                            notification_type="review_reply",
                            message="",  # Will be dynamically generated
                            review=review
                        )
                except Review.DoesNotExist:
                    pass  # Optional: handle if parent is invalid

            else:
                if product.seller != request.user:
                    send_notification(
                        user=product.seller,
                        sender=request.user,
                        notification_type="review",
                        message="",  # Will be dynamically generated
                        review=review
                    )

            return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    


class ReviewRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        # Optionally restrict to only the review's author
        if self.request.user != serializer.instance.author:
            raise PermissionDenied("You can only edit your own review.")
        serializer.save()
        
    def perform_destroy(self, instance):
        if self.request.user != instance.author:
            raise PermissionDenied("You can only delete your own review.")
        instance.delete()