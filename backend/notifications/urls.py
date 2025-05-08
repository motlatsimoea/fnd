from django.urls import path
from .views import (
    NotificationListView, 
    InboxNotificationView, 
    MarkNotificationReadView,
    MarkAllGeneralNotificationsReadView,
    MarkAllInboxNotificationsReadView,
)
urlpatterns = [
    path("", NotificationListView.as_view(), name="notifications"),
    path("inbox/", InboxNotificationView.as_view(), name='inbox_notifications'),
    path("mark-as-read/<int:pk>/", MarkNotificationReadView.as_view(), name="mark-notifications-read"),
    path("mark-all-read/", MarkAllGeneralNotificationsReadView.as_view(), name="mark_all_notifications_read"),
    path("inbox/mark-all-read/", MarkAllInboxNotificationsReadView.as_view(), name="mark_all_inbox_read"),
]
