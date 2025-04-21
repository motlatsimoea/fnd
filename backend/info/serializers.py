from rest_framework import serializers
from .models import Article, Tag, ArticleComment

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

class ArticleSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True)  # Nested serializer for tags
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'image', 'date', 'author', 'content', 'tags', 'status']
        

class ArticleCommentSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField()
    author_username = serializers.CharField(source='author.username', read_only=True)
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = ArticleComment
        fields = ['id', 'article', 'author', 'author_username', 'content', 'parent', 'replies', 'created_at', 'updated_at']

    def get_replies(self, obj):
        if obj.replies.exists():
            return ArticleCommentSerializer(obj.replies.all(), many=True).data
        return []
