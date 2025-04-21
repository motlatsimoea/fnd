from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    post_id = serializers.IntegerField(source="post.id", read_only=True, allow_null=True)
    inbox_id = serializers.IntegerField(source="inbox.id", read_only=True, allow_null=True)
    comment_id = serializers.UUIDField(source="comment.id", read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "sender",
            "sender_username",
            "notification_type",
            "message",
            "post_id",
            "comment_id",
            "inbox_id",
            "timestamp"
        ]
        read_only_fields = ["id", "timestamp"]
