from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Profile, Sector, CustomUser 
from blog.serializers import PostSerializer
from market.serializers import ProductSerializer
from blog.serializers import Post
from django.utils import timezone
from follows.models import Follow
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

class FollowUserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "profile_picture"
        ]

    def get_profile_picture(self, obj):
        try:
            profile = obj.profile

            if profile and profile.profile_picture:
                return (
                    f"{settings.SUPABASE_PUBLIC_URL}/storage/v1/object/public/"
                    f"{settings.SUPABASE_STORAGE_BUCKET}/"
                    f"{profile.profile_picture.name}"
                )
        except Exception:
            pass

        return None
        
class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = ['id', 'name']
        

class ProfileSerializer(serializers.ModelSerializer):

    user_id         = serializers.IntegerField(source="user.id", read_only=True)
    username        = serializers.CharField(source="user.username", required=False)
    email           = serializers.EmailField(source="user.email", required=False)

    sectors         = SectorSerializer(source="user.sectors", many=True, read_only=True)

    sector_ids      = serializers.PrimaryKeyRelatedField(queryset=Sector.objects.all(),
                                                            many=True,
                                                            write_only=True,
                                                            required=False,
                                                            source="user.sectors"
                                                        )

    posts           = PostSerializer(many=True, read_only=True, source="user.posts")
    products        = ProductSerializer(many=True, read_only=True, source="user.products")

    liked_posts     = serializers.SerializerMethodField()

    followers       = serializers.SerializerMethodField()
    following       = serializers.SerializerMethodField()

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    is_following    = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "user_id", "username", "email",
            "first_name", "last_name", "location",
            "phone_number", "bio",
            "profile_picture", "background_picture",
            "sectors", "sector_ids",

            "posts",
            "products",
            "liked_posts",

            "followers",
            "following",

            "followers_count",
            "following_count",

            "is_following",
        ]
        

    def get_liked_posts(self, obj):
        """Return posts this user has liked"""
        liked_qs = Post.objects.filter(likes__user=obj.user).distinct()
        return PostSerializer(liked_qs, many=True, context=self.context).data
    
    
    def get_followers(self, obj):
        followers = User.objects.filter(following__following=obj.user)
        return FollowUserSerializer(followers, many=True, context=self.context).data
    
    def get_following(self, obj):
        following = User.objects.filter(followers__follower=obj.user)
        return FollowUserSerializer(following, many=True, context=self.context).data
    
    
    def get_followers_count(self, obj):
        return obj.user.followers.count()

    def get_following_count(self, obj):
        return obj.user.following.count()
    
    def get_is_following(self, obj):
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            return Follow.objects.filter(
                follower=request.user,
                following=obj.user
            ).exists()

        return False

    def update(self, instance, validated_data):

        user_data = validated_data.pop("user", {})

        sectors = user_data.pop(
            "sectors",
            None
        )

        for attr, value in user_data.items():
            setattr(instance.user, attr, value)

        instance.user.save()

        if sectors is not None:
            instance.user.sectors.set(sectors)

        return super().update(
            instance,
            validated_data
        )


class UserSerializer(serializers.ModelSerializer):
    
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    agreed_to_terms = serializers.BooleanField(write_only=True)

    sectors = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True
    )

    sectors_display = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'email',
            'phone_number',  
            'password',
            'sectors',
            'sectors_display',
            'agreed_to_terms'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, data):
        if not data.get('agreed_to_terms'):
            raise serializers.ValidationError({
                "agreed_to_terms": "You must agree to the Terms and Privacy Policy."
            })

        # ✅ Require email OR phone
        if not data.get('email') and not data.get('phone_number'):
            raise serializers.ValidationError(
                "Provide either email or phone number."
            )

        return data

    def validate_email(self, value):
        if value and CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_phone_number(self, value):
        if value and CustomUser.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already exists.")
        return value

    def create(self, validated_data):
        sectors_data = validated_data.pop('sectors', [])
        password = validated_data.pop('password')
        validated_data.pop('agreed_to_terms')

        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)

        user.terms_accepted_at = timezone.now()
        user.is_active = False
        user.save()

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

        token["username"] = user.username
        token["email"] = user.email
        token["is_staff"] = user.is_staff

        return token

    def validate(self, attrs):
        #print("=== LOGIN ATTEMPT ===")

        username = attrs.get("username")
        password = attrs.get("password")

        #print("USERNAME:", username)
        #print("PASSWORD PROVIDED:", bool(password))

        try:
            user = User.objects.get(username=username)

            #print("USER FOUND:", user.username)
            #print("ACTIVE:", user.is_active)
            #print("DEACTIVATED_AT:", user.deactivated_at)

        except User.DoesNotExist:
            #print("USER NOT FOUND")
            raise serializers.ValidationError("Invalid username or password")

        password_ok = user.check_password(password)

        #print("PASSWORD CHECK:", password_ok)

        if not password_ok:
            raise serializers.ValidationError("Invalid username or password")

        #print("PASSED PASSWORD CHECK")

        if user.deactivated_at:
            #print("ACCOUNT IS DEACTIVATED")

            expired = user.is_deactivation_expired()

            #print("DEACTIVATION EXPIRED:", expired)

            if not expired:
                #print("REACTIVATING ACCOUNT")

                user.is_active = True
                user.deactivated_at = None
                user.save(update_fields=["is_active", "deactivated_at"])

                #print("ACCOUNT REACTIVATED")
            else:
                #print("ACCOUNT EXPIRED")
                raise serializers.ValidationError(
                    "Account has been permanently deleted."
                )

        #print("ACTIVE STATUS AFTER CHECK:", user.is_active)

        if not user.is_active:
            #print("ACCOUNT STILL INACTIVE")
            raise serializers.ValidationError("Account is not active.")

        #print("CREATING TOKENS")

        refresh = self.get_token(user)

        #print("TOKENS CREATED")

        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializerWithToken(user).data,
        }

        #print("LOGIN SUCCESS")

        return data


