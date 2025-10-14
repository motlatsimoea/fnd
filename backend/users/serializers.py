from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .utils import generate_user_token, generate_login_token
from django.db import models
from .models import Profile, Sector, CustomUser 
from blog.serializers import PostSerializer
from market.serializers import ProductSerializer


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", required=False)
    email = serializers.EmailField(source="user.email", required=False)
    sectors = serializers.SerializerMethodField()
    posts = PostSerializer(many=True, read_only=True, source="user.posts")
    products = ProductSerializer(many=True, read_only=True, source="user.products")

    class Meta:
        model = Profile
        fields = [
            'username', 'email',
            'first_name', 'last_name', 'location',
            'phone_number', 'bio', 'profile_picture', 'background_picture',
            'sectors',
            'posts', 'products'
        ]
        
    def get_sectors(self, obj):
        """Return user's sector names"""
        return [sector.name for sector in obj.user.sectors.all()]
        
    def update(self, instance, validated_data):
        # Handle nested user fields (username, email)
        user_data = validated_data.pop("user", {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()

        # Update profile fields
        return super().update(instance, validated_data)
    
    

class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = ['id', 'name']



class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    sectors = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True  
    )
    sectors_display = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'sectors', 'sectors_display']
        extra_kwargs = {
            'password': {'write_only': True},
        }
        
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value
    
    def create(self, validated_data):
        sectors_data = validated_data.pop('sectors', [])
        password = validated_data.pop('password')
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        # Associate sectors with the user
        sectors = Sector.objects.filter(name__in=sectors_data)
        user.sectors.set(sectors)
        return user

    def update(self, instance, validated_data):
        sectors_data = validated_data.pop('sectors', None)
        if sectors_data:
            sectors = Sector.objects.filter(name__in=sectors_data)
            instance.sectors.set(sectors)
        return super().update(instance, validated_data)

    def get_sectors_display(self, obj):
        return [sector.name for sector in obj.sectors.all()]



class UserSerializerWithToken(serializers.ModelSerializer):
    isAdmin = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'isAdmin']


    def get_isAdmin(self, obj):
        return obj.is_staff
    


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email 
        token['is_staff'] = user.is_staff  
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        refresh = self.get_token(self.user)
        data['refresh'] = str(refresh)                
        data['access'] = str(refresh.access_token)

        data['user'] = UserSerializerWithToken(self.user).data 
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'is_staff']
    
