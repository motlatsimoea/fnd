from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Prefetch
from django.contrib.auth import get_user_model
from .models import Follow
from blog.models import Comment
from .serializers import FollowSerializer
from notifications.utils import send_notification

from blog.models import Post
from blog.serializers import PostSerializer

User = get_user_model()



class ToggleFollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):

        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        if target_user == request.user:
            return Response({"detail": "You cannot follow yourself"}, status=400)

        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=target_user
        )

        if not created:
            follow.delete()
            return Response({"status": "unfollowed"})

        # 🔔 SEND FOLLOW NOTIFICATION
        send_notification(
            user=target_user,
            sender=request.user,
            notification_type="follow"
        )

        return Response({"status": "followed"})
    

class FollowersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):

        user = User.objects.get(username=username)

        followers = Follow.objects.filter(
            following=user
        ).select_related("follower", "follower__profile")

        serializer = FollowSerializer(followers, many=True)

        return Response(serializer.data)
    
    
class FollowingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):

        user = User.objects.get(username=username)

        following = Follow.objects.filter(
            follower=user
        ).select_related("following", "following__profile")

        serializer = FollowSerializer(following, many=True)

        return Response(serializer.data)
    
    
    
class FollowingFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        following_ids = Follow.objects.filter(
            follower=request.user
        ).values_list("following_id", flat=True)

        posts = Post.objects.filter(
            author__id__in=following_ids
        ).select_related("author").prefetch_related(
            "hashtags",
            "media",
            "likes",
            Prefetch("comments", queryset=Comment.objects.select_related("author"))
        ).order_by("-created_at")

        serializer = PostSerializer(posts, many=True, context={"request": request})

        return Response(serializer.data)