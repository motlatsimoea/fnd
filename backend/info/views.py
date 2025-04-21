from rest_framework import generics, permissions
from django.db.models import Q
from .models import Article, Tag, ArticleComment
from .serializers import ArticleSerializer, TagSerializer, ArticleCommentSerializer
from django.core.exceptions import PermissionDenied

class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleSerializer

    def get_queryset(self):
        queryset = Article.objects.filter(status='published')
        query = self.request.query_params.get('q', None)
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(content__icontains=query) |
                Q(tags__name__icontains=query)  # If using Taggit or related name
            ).distinct()
        return queryset
    
    

class ArticleDetailView(generics.RetrieveAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    lookup_field = 'slug'

class TagListView(generics.ListCreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class ArticleByTagView(generics.ListAPIView):
    serializer_class = ArticleSerializer

    def get_queryset(self):
        tag_slug = self.kwargs['tag_slug']
        return Article.objects.filter(tags__slug=tag_slug, status='published')


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = ArticleCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        article_id = self.kwargs.get('article_id')
        return ArticleComment.objects.filter(article_id=article_id, parent=None).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, article_id=self.kwargs.get('article_id'))

class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ArticleComment.objects.all()
    serializer_class = ArticleCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            raise PermissionDenied("You can only edit your own comments.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied("You can only delete your own comments.")
        instance.delete()