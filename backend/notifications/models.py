from django.db import models
from django.contrib.auth import get_user_model
from blog.models import Post, Comment
from chat.models import Inbox
from market.models import Review

User = get_user_model()

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('reply', 'Reply'),
        ('message', 'Message'),
        ('review', 'Review'),
    ]

    user                = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    sender              = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_notifications")
    notification_type   = models.CharField(max_length=10, choices=NOTIFICATION_TYPES)

    post                = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    comment             = models.ForeignKey(Comment, on_delete=models.CASCADE, null=True, blank=True)
    inbox               = models.ForeignKey(Inbox, on_delete=models.CASCADE, null=True, blank=True)
    review              = models.ForeignKey(Review, on_delete=models.CASCADE, null=True, blank=True)

    message             = models.TextField(null=True, blank=True)
    is_read             = models.BooleanField(default=False)
    timestamp           = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_notification_type_display()} from {self.sender.username} to {self.user.username}"
