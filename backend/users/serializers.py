from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Profile, Sector, CustomUser 
from blog.serializers import PostSerializer
from market.serializers import ProductSerializer
from blog.serializers import Post
from django.utils import timezone


class ProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", required=False)
    email = serializers.EmailField(source="user.email", required=False)
    sectors = serializers.SerializerMethodField()
    posts = PostSerializer(many=True, read_only=True, source="user.posts")
    products = ProductSerializer(many=True, read_only=True, source="user.products")
    liked_posts = serializers.SerializerMethodField()  # <-- new field

    class Meta:
        model = Profile
        fields = [
            'user_id', 'username', 'email',
            'first_name', 'last_name', 'location',
            'phone_number', 'bio', 'profile_picture', 'background_picture',
            'sectors',
            'posts', 'products', 'liked_posts'  # include it here
        ]

    def get_sectors(self, obj):
        """Return user's sector names"""
        return [sector.name for sector in obj.user.sectors.all()]

    def get_liked_posts(self, obj):
        """Return posts this user has liked"""
        liked_qs = Post.objects.filter(likes__user=obj.user).distinct()
        return PostSerializer(liked_qs, many=True, context=self.context).data

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
    #profile = ProfileSerializer(read_only=True)
    agreed_to_terms = serializers.BooleanField(write_only=True)
    sectors = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True  
    )
    sectors_display = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'sectors', 'sectors_display', 'agreed_to_terms']
        extra_kwargs = {
            'password': {'write_only': True},
        }
        
    def validate(self, data):
        if not data.get('agreed_to_terms'):
            raise serializers.ValidationError(
                {"agreed_to_terms": "You must agree to the Terms and Privacy Policy."}
            )
        return data
    
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value
    
    
    from django.utils import timezone

    def create(self, validated_data):
        sectors_data    = validated_data.pop('sectors', [])
        password        = validated_data.pop('password')
        agreed          = validated_data.pop('agreed_to_terms', False)

        if not agreed:
            raise serializers.ValidationError(
                {"agreed_to_terms": "You must agree to the Terms and Privacy Policy."}
            )

        user            = CustomUser.objects.create(**validated_data)
        user.set_password(password)

        # ✅ Store timestamp of agreement
        user.terms_accepted_at = timezone.now()
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
    default_error_messages = {
        "no_active_account": "Invalid username or password"
    }
    
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
        
        # 🔥 Reactivate if within 30 days
        if not self.user.is_active and self.user.deactivated_at:
            if not self.user.is_deactivation_expired():
                self.user.is_active = True
                self.user.deactivated_at = None
                self.user.save()
            else:
                raise serializers.ValidationError("Account has been permanently deleted.")

        refresh = self.get_token(self.user)
        data['refresh'] = str(refresh)                
        data['access'] = str(refresh.access_token)

        data['user'] = UserSerializerWithToken(self.user).data 
        return data


