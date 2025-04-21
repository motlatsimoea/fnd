from django.contrib import admin
from .models import Tag, Article, ArticleComment

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'date')
    list_filter = ('status', 'date', 'tags')
    search_fields = ('title', 'author', 'content')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('tags',)

@admin.register(ArticleComment)
class ArticleCommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'article', 'created_at', 'parent')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('author__username', 'content', 'article__title')
    raw_id_fields = ('author', 'article', 'parent')
