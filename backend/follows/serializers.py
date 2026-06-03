from rest_framework import serializers
from .models import Follow
from users.models import Profile


class FollowSerializer(serializers.ModelSerializer):

    follower_username = serializers.CharField(source="follower.username", read_only=True)
    following_username = serializers.CharField(source="following.username", read_only=True)

    follower_avatar = serializers.ImageField(
        source="follower.profile.profile_picture",
        read_only=True
    )

    class Meta:
        model = Follow
        fields = [
            "id",
            "follower",
            "following",
            "follower_username",
            "following_username",
            "follower_avatar",
            "created_at"
        ]
        read_only_fields = ["follower"]