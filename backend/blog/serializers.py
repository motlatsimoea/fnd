from rest_framework import serializers
from django.utils.timesince import timesince
from .models import Post, Media, Like, Comment
from users.serializers import UserSerializer
from users.models import CustomUser


class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email']



class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['id', 'file', 'uploaded_at']


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField()
    author_username = serializers.CharField(source='author.username', read_only=True) 
    time_since_posted = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'author_username', 'time_since_posted',
            'content', 'parent', 'replies', 'created_at', 'updated_at'
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

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []
    
    def get_time_since_posted(self, obj):
        return timesince(obj.created_at) + " ago"
    




class PostSerializer(serializers.ModelSerializer):
    author = PublicUserSerializer(read_only=True)
    media = MediaSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    time_since_posted = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()
    authorImage = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'author', 'tags',
            'created_at', 'updated_at', 'time_since_posted',
            'media_count', 'media',
            'likes_count', 'is_liked', 'comments', 'authorImage'
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        return obj.likes.filter(user=request.user).exists() if request and request.user.is_authenticated else False

    def get_time_since_posted(self, obj):
        return timesince(obj.created_at) + " ago"

    def get_media_count(self, obj):
        return obj.media.count()


    def get_authorImage(self, obj):
        request = self.context.get('request')

        try:
            profile = obj.author.profile
            if profile and profile.profile_picture:
                return request.build_absolute_uri(profile.profile_picture.url)
        except Exception:
            pass

        return None


