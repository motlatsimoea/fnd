from django.contrib import admin
from .models import Inbox, Message

@admin.register(Inbox)
class InboxAdmin(admin.ModelAdmin):
    list_display = ("id", "unique_key", "participants_list", "created_at")  # Fields in the admin list view
    search_fields = ("unique_key",)  # Search by chat key
    list_filter = ("created_at",)  # Filter by creation date

    def participants_list(self, obj):
        """Show participants as a comma-separated string"""
        return ", ".join([user.username for user in obj.participants.all()])
    participants_list.short_description = "Participants"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "inbox", "sender", "content", "timestamp")  # Fields to show
    search_fields = ("sender__username", "content")  # Search by sender username or message text
    list_filter = ("timestamp",)  # Filter messages by date
    ordering = ("-timestamp",)  # Show newest messages first

