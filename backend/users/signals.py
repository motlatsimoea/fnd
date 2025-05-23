from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile

CustomUser = get_user_model()

@receiver(post_save, sender=CustomUser)
def create_profile(sender, instance, created, **kwargs):
    """
    Create a profile for each new user.
    """
    if created:
        Profile.objects.create(user=instance)
