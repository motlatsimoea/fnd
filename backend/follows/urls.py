from django.urls import path
from .views import (
    ToggleFollowView,
    FollowersListView,
    FollowingListView,
    FollowingFeedView
)

urlpatterns = [
    path("follow/feed/", FollowingFeedView.as_view()),
    path("follow/<str:username>/", ToggleFollowView.as_view()),
    path("followers/<str:username>/", FollowersListView.as_view()),
    path("following/<str:username>/", FollowingListView.as_view()),
    
]