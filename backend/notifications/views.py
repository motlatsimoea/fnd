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
            qs = Notification.objects.filter(user=self.request.user)
            if self.notification_types:
                qs = qs.filter(
                    notification_type__in=(
                        self.notification_types
                        if isinstance(self.notification_types, list)
                        else [self.notification_types]
                    )
                )
            return qs.order_by("-timestamp")

    def get(self, request):
        notifications = self.get_queryset()

        # unread filter
        if request.query_params.get("unread") == "true":
            notifications = notifications.filter(is_read=False)

        unread_count = self.get_queryset().filter(is_read=False).count()

        # paginate results
        paginator = NotificationPagination()
        page = paginator.paginate_queryset(notifications, request)
        serializer = NotificationSerializer(page, many=True)

        # Correct usage: pass serializer.data (list) into get_paginated_response
        paginated_response = paginator.get_paginated_response(serializer.data)
        # attach unread_count at top level
        paginated_response.data['unread_count'] = unread_count
        return paginated_response


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
        filters = {"user": request.user, "is_read": False}
        if self.notification_types:
            filters["notification_type__in"] = (
                self.notification_types
                if isinstance(self.notification_types, list)
                else [self.notification_types]
            )

        Notification.objects.filter(**filters).update(is_read=True)
        return Response({"success": True, "message": "Notifications marked as read."})


class MarkAllGeneralNotificationsReadView(MarkAllNotificationsReadView):
    notification_types = ["like", "comment", "reply", "review"]


class MarkAllInboxNotificationsReadView(MarkAllNotificationsReadView):
    notification_types = "message"