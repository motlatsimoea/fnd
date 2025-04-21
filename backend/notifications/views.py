from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch "like", "comment", and "reply" notifications for the logged-in user
        notifications = Notification.objects.filter(
            user=request.user,
            notification_type__in=["like", "comment", "reply"]
        ).order_by("-timestamp")

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=200)



class InboxNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch inbox (message) notifications for the logged-in user
        inbox_notifications = Notification.objects.filter(
            user=request.user,
            notification_type="message"
        ).order_by("-timestamp")  # Most recent first

        # Serialize and return the notifications
        serializer = NotificationSerializer(inbox_notifications, many=True)
        return Response(serializer.data, status=200)
