from django.urls import path
from .views import ArticleListView, ArticleDetailView, TagListView, ArticleByTagView, CommentListCreateView, CommentDetailView

urlpatterns = [
    path('', ArticleListView.as_view(), name='article-list'),
    path('<slug:slug>/', ArticleDetailView.as_view(), name='article-detail'),
    path('tags/', TagListView.as_view(), name='tag-list'),
    path('tag/<slug:tag_slug>/', ArticleByTagView.as_view(), name='articles-by-tag'),
    
    path('<uuid:id>/comments/', CommentListCreateView.as_view(), name='article-comments'),
    path('comments/<uuid:id>/', CommentDetailView.as_view(), name='comment-detail'),
]
