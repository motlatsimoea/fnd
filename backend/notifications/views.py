from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch notifications for the logged-in user (likes & comments)
        notifications = Notification.objects.filter(
            user=request.user, 
            notification_type__in=["like", "comment"]
        ).order_by("-created_at")  # Show most recent first

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=200)
