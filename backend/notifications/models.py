from django.db import models
from django.contrib.auth import get_user_model as User
from blog.models import Post
from chat.models import Inbox


class Notification(models.Model):
    """
    Represents a notification for likes, comments, and messages.
    """
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('message', 'Message'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_notifications")
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)  # For like/comment notifications
    inbox = models.ForeignKey(Inbox, on_delete=models.CASCADE, null=True, blank=True)  # For message notifications
    message = models.TextField(null=True, blank=True)  # Message preview
    is_read = models.BooleanField(default=False)  # Mark if notification is read
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_notification_type_display()} notification for {self.user.username}"