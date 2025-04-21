from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification, Post, Comment, Inbox

def send_notification(user, sender, notification_type, message, post=None, comment=None, review=None):
    if notification_type == "like":
        message = f"{sender.username} liked your post."
    elif notification_type == "comment":
        message = f"{sender.username} commented on your post."
    elif notification_type == "reply":
        message = f"{sender.username} replied to your comment."
    elif notification_type == "message":
        message = f"You have a new message from {sender.username}."
    elif notification_type == "review":
        message = f"{sender.username} left a review on your product."
    elif notification_type == "review_reply":
        message = f"{sender.username} replied to your review."

    notification = Notification.objects.create(
        user=user,
        sender=sender,
        notification_type=notification_type,
        message=message,
        post=post,
        comment=comment,
        review=review
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notifications_{user.id}",
        {
            "type": "send_notification",
            "sender": sender.username,
            "message": message,
            "notification_type": notification_type,
            "post_id": post.id if post else None,
            "comment_id": comment.id if comment else None,
            "review_id": review.id if review else None,
        },
    )

def send_message_notification(user, sender, message, inbox):
    """
    Sends a WebSocket notification when a new message is received.
    
    :param user: The recipient of the message
    :param sender: The sender of the message
    :param message: The message text
    :param inbox: The inbox where the message belongs
    """
    # Create the notification in the database for message type
    notification = Notification.objects.create(
        user=user,
        sender=sender,
        notification_type="message",
        inbox=inbox,
        message=message
    )

    # Send the notification via WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notifications_{user.id}",
        {
            "type": "send_notification",
            "sender": sender.username,
            "message": message,
            "inbox_id": inbox.id,
            "notification_type": "message",
        },
    )
