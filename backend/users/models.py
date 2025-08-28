from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import os

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
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class CustomUserManager(BaseUserManager):
    """
    Custom user manager for the CustomUser model.
    Handles user creation for normal users, staff, and superusers.
    """
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', False)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if not extra_fields.get('is_staff'):
            raise ValueError('Superuser must have is_staff=True.')
        if not extra_fields.get('is_superuser'):
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    """
    Custom user model for the application.
    Adds additional fields like 'sectors' for normal users.
    """
    email = models.EmailField(unique=True)
    sectors = models.ManyToManyField(Sector, blank=True)

    # Replace the default User manager with the custom one
    objects = CustomUserManager()

    def __str__(self):
        return self.username




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
        default='profile_pictures/default.png'
    )
    background_picture = models.ImageField(
        upload_to="background_pictures/", 
        blank=True, 
        null=True, 
        default="background_pictures/default.jpg"
    )
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
