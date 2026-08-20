from rest_framework import serializers
from .models import Follow
from django.conf import settings

class FollowSerializer(serializers.ModelSerializer):

    follower_username = serializers.CharField(
        source="follower.username",
        read_only=True
    )

    following_username = serializers.CharField(
        source="following.username",
        read_only=True
    )

    follower_avatar = serializers.SerializerMethodField()

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

    def get_follower_avatar(self, obj):
        try:
            profile = obj.follower.profile

            if profile and profile.profile_picture:
                return (
                    f"{settings.SUPABASE_PUBLIC_URL}/storage/v1/object/public/"
                    f"{settings.SUPABASE_STORAGE_BUCKET}/"
                    f"{profile.profile_picture.name}"
                )
        except Exception:
            pass

        return None