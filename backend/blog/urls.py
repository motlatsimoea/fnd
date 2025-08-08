from django.urls import path
from .views import PostView, PostDetailView, LikeView, CommentView, CommentDetailView

urlpatterns = [
    path("", PostView.as_view(), name='posts'),
    path("create/", PostView.as_view(), name='create_post'),
    path("<uuid:post_id>/", PostDetailView.as_view(), name='post_detail'),
    path("<uuid:post_id>/like/", LikeView.as_view(), name='like_post'),
    path("<uuid:post_id>/comments/", CommentView.as_view(), name='post_comments'),
    path("<uuid:post_id>/comments/<uuid:id>/", CommentDetailView.as_view(), name='comment-detail'),
]
