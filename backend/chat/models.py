from django.contrib.auth import get_user_model
from django.db import models
from cryptography.fernet import Fernet
import base64
from django.conf import settings

User = get_user_model()

class Inbox(models.Model):
    """
    Represents a private chat between two users.
    """
    participants = models.ManyToManyField(User, related_name="chats")
    unique_key = models.CharField(max_length=255, unique=True)  # Unique key for two-person chats
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inbox {self.unique_key}"
    
    class Meta:
        verbose_name_plural = "Inboxes"


class Message(models.Model):
    """
    Represents a message sent in a chat room.
    """
    inbox = models.ForeignKey(Inbox, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(blank=True, null=True)
    encrypted_content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def set_content(self, content):
        """Encrypts the content before saving."""
        fernet = Fernet(settings.SECRET_KEY.encode())  # Use the key from settings
        self.encrypted_content = fernet.encrypt(content.encode()).decode()
        self.content = ""  # Clear plaintext content after encrypting

    def get_content(self):
        """Decrypts the content when accessed."""
        fernet = Fernet(settings.SECRET_KEY.encode())
        return fernet.decrypt(self.encrypted_content.encode()).decode()
    
    def save(self, *args, **kwargs):
        """Ensure encryption happens before saving."""
        if self.content:  # Encrypt only if content exists
            self.set_content(self.content)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Message {self.id} from {self.sender.username}"

