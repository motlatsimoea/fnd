from django.contrib import admin
from .models import Post, Media, Like, Comment


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at', 'tags')
    search_fields = ('title', 'content', 'tags')
    ordering = ('-created_at',)

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ('id', 'file', 'post', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('post__title', 'file')

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'post', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('post__title', 'user__username')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'post', 'author', 'created_at', 'parent')
    list_filter = ('created_at',)
    search_fields = ('post__title', 'author__username', 'content')
    ordering = ('-created_at',)

