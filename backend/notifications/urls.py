from django.urls import path
from .views import (
    NotificationListView,  
    MarkNotificationReadView,
    MarkAllGeneralNotificationsReadView,
    MarkInboxReadView,
    InboxNotificationListView
)
urlpatterns = [
    path("", NotificationListView.as_view(), name="notifications"),
    path("mark-as-read/<int:pk>/", MarkNotificationReadView.as_view(), name="mark-notifications-read"),
    path("mark-all-read/", MarkAllGeneralNotificationsReadView.as_view(), name="mark_all_notifications_read"),
    path("inbox/<int:inbox_id>/mark-read/", MarkInboxReadView.as_view(), name="mark_all_inbox_read"),
    path("inbox/", InboxNotificationListView.as_view(), name="inbox_notifications"),

]
