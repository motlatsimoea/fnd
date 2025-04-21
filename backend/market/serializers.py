from rest_framework import serializers
from .models import Product, ProductImage, Review
from django.contrib.auth import get_user_model

User = get_user_model()

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'author', 'rating', 'content', 'created_at']
        read_only_fields = ['author', 'created_at']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image']


class ProductSerializer(serializers.ModelSerializer):
    seller = serializers.StringRelatedField()
    average_rating = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)
    additional_images = ProductImageSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'seller', 'thumbnail', 'created_at', 'updated_at', 
                  'average_rating', 'reviews', 'additional_images']

    def get_average_rating(self, obj):
        return obj.average_rating()

    def create(self, validated_data):
        # Extract additional images from validated data
        images_data = validated_data.pop('additional_images', [])
        product = Product.objects.create(**validated_data)

        # Create ProductImage instances
        for image_data in images_data:
            ProductImage.objects.create(product=product, **image_data)

        return product
