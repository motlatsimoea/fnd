# serializers.py
from rest_framework import serializers
from .models import Product, ProductImage, Review
from django.contrib.auth import get_user_model

User = get_user_model()

class ReviewSerializer(serializers.ModelSerializer):
    # include parent so replies can be created / validated
    parent = serializers.PrimaryKeyRelatedField(queryset=Review.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Review
        fields = ['id', 'author', 'rating', 'content', 'created_at', 'parent', 'product']
        read_only_fields = ['author', 'created_at']
        # include 'product' read-only for clarity in responses; if you want it writable remove from read_only_fields

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ProductImageSerializer(serializers.ModelSerializer):
    # product should be read-only when nested under ProductSerializer
    product = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image']
        

class ProductSerializer(serializers.ModelSerializer):
    seller = serializers.StringRelatedField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)
    additional_images = ProductImageSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'seller', 'thumbnail',
                  'created_at', 'updated_at', 'average_rating', 'reviews', 'additional_images']

    def get_average_rating(self, obj):
        return obj.average_rating()

    def create(self, validated_data):
        images_data = validated_data.pop('additional_images', [])
        # seller may be passed via serializer.save(seller=...)
        seller = validated_data.pop('seller', None)
        if seller is not None:
            validated_data['seller'] = seller

        product = Product.objects.create(**validated_data)

        for image_data in images_data:
            # image_data should contain 'image' key; product is set explicitly
            ProductImage.objects.create(product=product, **{k: v for k, v in image_data.items() if k != 'product'})

        return product

    def update(self, instance, validated_data):
        # allow partial updates; ignore additional_images here (use separate endpoint)
        images_data = validated_data.pop('additional_images', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # optional: handle additional_images if required
        return instance
