from django.db import models
import uuid
from django.utils.text import slugify
from django_ckeditor_5.fields import CKEditor5Field
from django.contrib.auth import get_user_model

User = get_user_model()

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Article(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )

    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title   = models.CharField(max_length=200)
    slug    = models.SlugField(unique=True, blank=True)
    image   = models.ImageField(upload_to='articles/', blank=True, null=True)
    date    = models.DateField(auto_now_add=True)
    author  = models.CharField(max_length=100)
    content = CKEditor5Field('Text', config_name='default')
    tags    = models.ManyToManyField(Tag, related_name='articles')
    status  = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
    
    
class ArticleComment(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article     = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    author      = models.ForeignKey(User, on_delete=models.CASCADE)
    content     = models.TextField()
    parent      = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.author.username} on {self.article.title}"

