from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    # keep both names so older frontend code still works if needed
    notification_id = serializers.IntegerField(source="id", read_only=True)

    sender_username = serializers.CharField(source="sender.username", read_only=True)
    post_id = serializers.IntegerField(source="post.id", read_only=True, allow_null=True)
    inbox_id = serializers.IntegerField(source="inbox.id", read_only=True, allow_null=True)

    # <-- use IntegerField unless your Comment PK is a UUID
    comment_id = serializers.UUIDField(source="comment.id", read_only=True, allow_null=True)

    review_id = serializers.IntegerField(source="review.id", read_only=True, allow_null=True)
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "notification_id",
            "id",                     # keep original id too
            "sender_username",
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
