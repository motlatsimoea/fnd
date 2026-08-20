from rest_framework import serializers
from django.utils.timesince import timesince
from .models import Post, Media, Like, Comment, Hashtag
from django.conf import settings
from users.models import CustomUser


class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email']


class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ['id', 'name', 'usage_count']


class MediaSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = ['id', 'file', 'uploaded_at']
        
    def get_file(self, obj):
        if not obj.file:
            return None

        return (
            f"{settings.SUPABASE_PUBLIC_URL}/storage/v1/object/public/"
            f"{settings.SUPABASE_STORAGE_BUCKET}/{obj.file.name}"
        )


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField()
    author_username = serializers.CharField(source='author.username', read_only=True) 
    hashtags = HashtagSerializer(many=True, read_only=True)
    hashtag_names = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    author_profile_image = serializers.SerializerMethodField()
    time_since_posted = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'author_username', 'author_profile_image', 'time_since_posted',
            'content', 'parent', 'replies', 'hashtags',
            'hashtag_names', 'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
        

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            validated_data['author'] = user
        return super().create(validated_data)
    
    def validate(self, data):
        parent = data.get('parent')
        post = data.get('post')
        if parent and parent.post != post:
            raise serializers.ValidationError("Parent comment must belong to the same post.")
        return data
    
    
    def get_author_profile_image(self, obj):
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

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []
    
    def get_time_since_posted(self, obj):
        return timesince(obj.created_at) + " ago"
    




class PostSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)  # ✅ force string
    author = PublicUserSerializer(read_only=True)
    media = MediaSerializer(many=True, read_only=True)
    hashtags = HashtagSerializer(many=True, read_only=True)
    hashtag_names = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    time_since_posted = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()
    authorImage = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'content',
            'author',
            'hashtags',
            'hashtag_names',
            'created_at',
            'updated_at',
            'time_since_posted',
            'media_count',
            'media',
            'like_count',
            'is_liked',
            'comments',
            'authorImage',
        ]
    def get_like_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(user=request.user).exists()

    def get_time_since_posted(self, obj):
        return timesince(obj.created_at) + " ago"

    def get_media_count(self, obj):
        return obj.media.count()

    def get_authorImage(self, obj):
        profile = getattr(obj.author, 'profile', None)

        if not profile or not profile.profile_picture:
            return None

        return (
            f"{settings.SUPABASE_PUBLIC_URL}/storage/v1/object/public/"
            f"{settings.SUPABASE_STORAGE_BUCKET}/"
            f"{profile.profile_picture.name}"
        )





