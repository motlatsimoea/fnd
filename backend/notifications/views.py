from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
from .pagination import NotificationPagination


class NotificationBaseView(APIView):
    permission_classes = [IsAuthenticated]
    notification_types = None  

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user,
            notification_type__in=self.notification_types if isinstance(self.notification_types, list) else [self.notification_types]
        ).order_by("-timestamp")


    def get(self, request):
        notifications = self.get_queryset()

        if request.query_params.get("unread") == "true":
            notifications = notifications.filter(is_read=False)

        unread_count = self.get_queryset().filter(is_read=False).count()

        paginator = NotificationPagination()
        page = paginator.paginate_queryset(notifications, request)
        serializer = NotificationSerializer(page, many=True)

        return paginator.get_paginated_response({
            "notifications": serializer.data,
            "meta": {
                "total_count": self.get_queryset().count(),
                "unread_count": unread_count,
                "latest_timestamp": self.get_queryset().first().timestamp if self.get_queryset().exists() else None
            }
        })



class NotificationListView(NotificationBaseView):
    notification_types = ["like", "comment", "reply", "review"]


class InboxNotificationView(NotificationBaseView):
    notification_types = "message"



    
class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({"success": True})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=404)
        


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]
    notification_types = None  

    def post(self, request):
        Notification.objects.filter(
            user=request.user,
            is_read=False,
            notification_type__in=self.notification_types if isinstance(self.notification_types, list) else [self.notification_types]
        ).update(is_read=True)
        return Response({"success": True, "message": "Notifications marked as read."})


class MarkAllGeneralNotificationsReadView(MarkAllNotificationsReadView):
    notification_types = ["like", "comment", "reply", "review"]


class MarkAllInboxNotificationsReadView(MarkAllNotificationsReadView):
    notification_types = "message"
    
