from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import os
from django.utils import timezone
from datetime import timedelta
import random


def profile_picture_upload_to(instance, filename):
    """
    Define the upload path for profile pictures.
    Files will be stored in a directory named after the user's ID.
    """
    return os.path.join('profile_pictures', str(instance.user.id), filename)


class Sector(models.Model):
    """
    Model for farming sectors (e.g., Crop Farming, Livestock, etc.)
    """
    name    = models.CharField(max_length=100, unique=True)
    
    order   = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name



class CustomUserManager(BaseUserManager):

    def create_user(self, username, password=None, email=None, phone_number=None, **extra_fields):
        if not email and not phone_number:
            raise ValueError("User must have either email or phone number")

        if email:
            email = self.normalize_email(email)

        user = self.model(
            username=username,
            email=email,
            phone_number=phone_number,
            **extra_fields
        )

        user.set_password(password)

        # Normal users must go through your verification process
        user.is_active = False

        user.save(using=self._db)
        return user


    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('is_staff'):
            raise ValueError(
                'Superuser must have is_staff=True.'
            )

        if not extra_fields.get('is_superuser'):
            raise ValueError(
                'Superuser must have is_superuser=True.'
            )

        if not password:
            raise ValueError(
                'Superuser must have a password.'
            )

        if email:
            email = self.normalize_email(email)

        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )

        user.set_password(password)

        # Superusers do NOT need verification
        user.is_active = True
        user.is_email_verified = True
        user.is_phone_verified = True

        user.save(using=self._db)

        return user



class CustomUser(AbstractUser):
    """
    Custom user model for the application.
    Adds additional fields like 'sectors' for normal users.
    """
    email               = models.EmailField(unique=True, null=True, blank=True)
    phone_number        = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    is_phone_verified   = models.BooleanField(default=False)
    is_email_verified   = models.BooleanField(default=False)
    
    sectors             = models.ManyToManyField(Sector, blank=True)
    deactivated_at      = models.DateTimeField(null=True, blank=True)
    terms_accepted_at   = models.DateTimeField(null=True, blank=True)
    # Replace the default User manager with the custom one
    objects = CustomUserManager()
    
    def is_deactivation_expired(self):
        if not self.deactivated_at:
            return False

        return timezone.now() > self.deactivated_at + timedelta(days=30)

    def __str__(self):
        return self.username
    
    

class OTP(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return (timezone.now() - self.created_at).seconds > 300  # 5 mins



class Profile(models.Model):
    """
    Profile model for storing additional user information.
    """
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to=profile_picture_upload_to, 
        blank=True, 
        null=True, 
    )
    background_picture = models.ImageField(
        upload_to="background_pictures/", 
        blank=True, 
        null=True, 
    )
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
