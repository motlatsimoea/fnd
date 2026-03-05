from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    notification_id = serializers.IntegerField(source="id", read_only=True)

    sender_username = serializers.CharField(source="sender.username", read_only=True)
    sender_avatar = serializers.SerializerMethodField()

    post_id = serializers.UUIDField(source="post.id", read_only=True, allow_null=True)
    inbox_id = serializers.IntegerField(source="inbox.id", read_only=True, allow_null=True)
    comment_id = serializers.UUIDField(source="comment.id", read_only=True, allow_null=True)
    review_id = serializers.IntegerField(source="review.id", read_only=True, allow_null=True)

    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "notification_id",
            "id",
            "sender_username",
            "sender_avatar",   # ✅ NEW FIELD
            "notification_type",
            "message",
            "post_id",
            "comment_id",
            "inbox_id",
            "review_id",
            "is_read",
            "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]

    def get_sender_avatar(self, obj):
        request = self.context.get("request")

        if hasattr(obj.sender, "profile") and obj.sender.profile.profile_picture:
            url = obj.sender.profile.profile_picture.url
            return request.build_absolute_uri(url) if request else url

        return None