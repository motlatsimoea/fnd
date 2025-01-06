from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .utils import generate_user_token, generate_login_token
from django.db import models
from .models import Profile, Sector, CustomUser 

class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    sectors = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True  # Accept sector names from the frontend
    )
    sectors_display = serializers.SerializerMethodField()  # Display sector names in the response

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'sectors', 'sectors_display']
        extra_kwargs = {
            'password': {'write_only': True},
        }
        

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
    token = serializers.SerializerMethodField(read_only=True)
    isAdmin = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'isAdmin', 'token']

    def get_token(self, obj):
        return generate_login_token(obj)['access']

    def get_isAdmin(self, obj):
        return obj.is_staff
    

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # Generate the base token
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email  # Optional: Include email
        token['is_staff'] = user.is_staff  # Optional: Include is_staff
        return token

    def validate(self, attrs):
        # Validate the user and get the base token data
        data = super().validate(attrs)

        # Generate additional user-specific token data (if any custom logic exists)
        user_token_data = generate_login_token(self.user)  # Custom function
        data.update(user_token_data)

        # Add user details (full user data if required)
        data['user'] = UserSerializerWithToken(self.user).data
        return data

    




class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the Profile model.
    """
    class Meta:
        model = Profile
        fields = ['first_name', 'last_name', 'location', 'phone_number', 'bio', 'profile_picture']
