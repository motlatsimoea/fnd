from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'sender',
        'notification_type',
        'post',
        'comment',
        'inbox',
        'is_read',
        'timestamp',
    )
    list_filter = ('notification_type', 'is_read', 'timestamp')
    search_fields = ('user__username', 'sender__username', 'message', 'comment__content')
    readonly_fields = ('timestamp',)

    fieldsets = (
        (None, {
            'fields': ('user', 'sender', 'notification_type', 'is_read')
        }),
        ('Content Details', {
            'fields': ('post', 'comment', 'inbox', 'message')  # added 'comment'
        }),
        ('Timestamps', {
            'fields': ('timestamp',)
        }),
    )
