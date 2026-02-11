from django.contrib import admin
from .models import Post, Media, Like, Comment, Hashtag


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at', 'hashtags')
    search_fields = ('title', 'content', 'hashtags')
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

@admin.register(Hashtag)
class HashtagAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "usage_count", "post_count", "created_at")
    search_fields = ("name",)
    ordering = ("-usage_count",)
    readonly_fields = ("usage_count",)

    def post_count(self, obj):
        return obj.posts.count()
    post_count.short_description = "Posts"

