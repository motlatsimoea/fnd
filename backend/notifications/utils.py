from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification


def _build_notification_payload(notification):
    """Builds a structured payload from a Notification instance."""
    return {
        "sender": notification.sender.username,
        "notification_type": notification.notification_type,
        "message": notification.message,
        "post_id": notification.post.id if notification.post else None,
        "comment_id": notification.comment.id if notification.comment else None,
        "review_id": notification.review.id if notification.review else None,
        "inbox_id": notification.inbox.id if notification.inbox else None,
        "notification_id": notification.id,
        "is_read": notification.is_read,
        "timestamp": notification.timestamp.isoformat(),
    }


def _send_websocket_notification(user, payload):
    """Sends the structured payload to the user's WebSocket group."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notifications_{user.id}",
        {
            "type": "send_notification",  # consumer method name
            "payload": payload            # actual notification data
        }
    )


def send_notification(user, sender, notification_type, message=None, post=None, comment=None, review=None):
    """Handles non-inbox notification creation and dispatch."""
    if notification_type == "like":
        message = f"{sender.username} liked your post."
    elif notification_type == "comment":
        message = f"{sender.username} commented on your post."
    elif notification_type == "reply":
        message = f"{sender.username} replied to your comment."
    elif notification_type == "review":
        message = f"{sender.username} left a review on your product."
    elif notification_type == "review_reply":
        message = f"{sender.username} replied to your review."
    elif notification_type == "message" and not message:
        # fallback if no message provided
        message = f"You have a new message from {sender.username}."

    notification = Notification.objects.create(
        user=user,
        sender=sender,
        notification_type=notification_type,
        message=message,
        post=post,
        comment=comment,
        review=review
    )

    payload = _build_notification_payload(notification)
    _send_websocket_notification(user, payload)


def send_message_notification(user, sender, message, inbox):
    """Handles inbox-specific message notification creation and dispatch."""
    notification = Notification.objects.create(
        user=user,
        sender=sender,
        notification_type="message",
        message=message or f"You have a new message from {sender.username}.",
        inbox=inbox
    )

    payload = _build_notification_payload(notification)
    _send_websocket_notification(user, payload)
