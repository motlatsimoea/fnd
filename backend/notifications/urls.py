from django.urls import path
from .views import NotificationListView, InboxNotificationView

urlpatterns = [
    path("", NotificationListView.as_view(), name="notifications"),
    path("inbox/", InboxNotificationView.as_view(), name='inbox_notifications'),
]
