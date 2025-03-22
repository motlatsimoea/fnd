from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

def send_notification(user, sender, notification_type, message, post=None):
    """
    Create a notification and send it via WebSocket.
    
    :param user: The recipient of the notification
    :param sender: The user performing the action
    :param notification_type: 'like' or 'comment'
    :param message: Notification message
    :param post: The related post (optional)
    """
    notification = Notification.objects.create(
        user=user,
        sender=sender,
        notification_type=notification_type,
        message=message,
        post=post
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notifications_{user.id}",
        {
            "type": "send_notification",
            "sender": sender.username,
            "post_id": post.id if post else None,
            "notification_type": notification_type,
            "message": message,
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
    # Create a notification in the database
    Notification.objects.create(
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
