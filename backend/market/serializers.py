# serializers.py
from rest_framework import serializers
from .models import Product, ProductImage, Review
from django.conf import settings
from django.utils.timesince import timesince
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class ReviewSerializer(serializers.ModelSerializer):
    # include parent so replies can be created / validated
    parent = serializers.PrimaryKeyRelatedField(queryset=Review.objects.all(), required=False, allow_null=True)
    author = UserSerializer(read_only=True) 
    profile_image = serializers.SerializerMethodField()
    time_since_posted = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'author', 'rating', 'content', 'created_at', 'profile_image', 'parent', 'product', 'time_since_posted']
        read_only_fields = ['author', 'created_at', 'product']
        # include 'product' read-only for clarity in responses; if you want it writable remove from read_only_fields

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
    
    def get_profile_image(self, obj):
        try:
            profile = obj.author.profile

            if profile and profile.profile_picture:
                return (
                    f"{settings.SUPABASE_PUBLIC_URL}/storage/v1/object/public/"
                    f"{settings.SUPABASE_STORAGE_BUCKET}/"
                    f"{profile.profile_picture.name}"
                )
        except Exception:
            pass

        return None
    
    def validate(self, data):
        parent = data.get('parent', None)
        product = data.get('product', None) or self.instance.product if self.instance else None
        if parent and parent.product != product:
            raise serializers.ValidationError("Parent review must be for the same product.")
        return data
    
    def get_time_since_posted(self, obj):
            return timesince(obj.created_at) + " ago"


class ProductImageSerializer(serializers.ModelSerializer):
    # product should be read-only when nested under ProductSerializer
    product = serializers.PrimaryKeyRelatedField(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image']

    def validate(self, attrs):
        product = self.context.get('product')

        if product and product.additional_images.count() >= 4:
            raise serializers.ValidationError(
                "A product can only have up to 4 additional images."
            )

        return attrs

    def get_image(self, obj):
        if not obj.image:
            return None

        return (
            f"{settings.SUPABASE_PUBLIC_URL}/storage/v1/object/public/"
            f"{settings.SUPABASE_STORAGE_BUCKET}/{obj.image.name}"
        )
        

class ProductSerializer(serializers.ModelSerializer):
    seller = serializers.StringRelatedField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)
    additional_images = ProductImageSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'price',
            'seller',
            'thumbnail',
            'created_at',
            'updated_at',
            'average_rating',
            'reviews',
            'additional_images'
        ]
        read_only_fields = [
            'seller',
            'created_at',
            'updated_at',
            'average_rating',
            'reviews',
            'additional_images'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if instance.thumbnail:
            representation['thumbnail'] = (
                f"{settings.SUPABASE_PUBLIC_URL}/storage/v1/object/public/"
                f"{settings.SUPABASE_STORAGE_BUCKET}/{instance.thumbnail.name}"
            )
        else:
            representation['thumbnail'] = None

        return representation

    def get_average_rating(self, obj):
        return obj.average_rating()
    

    def create(self, validated_data):
        seller = validated_data.pop('seller', None)

        if seller is not None:
            validated_data['seller'] = seller

        return Product.objects.create(**validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('additional_images', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        return instance