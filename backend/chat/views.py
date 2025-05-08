from rest_framework.views import APIView
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from .models import Inbox, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from cryptography.fernet import Fernet
from django.conf import settings
from asgiref.sync import async_to_sync
from notifications.utils import send_message_notification
from notifications.models import Notification
from django.shortcuts import get_object_or_404



User = get_user_model()

class ChatListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all chats the user is part of
        chats = Inbox.objects.filter(participants=request.user)
        serializer = ChatRoomSerializer(chats, many=True)
        return Response(serializer.data, status=200)
    
    
class ChatDetailView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        chat_id = self.kwargs['chat_id']

        # Ensure the user is a participant of this chat
        chat = get_object_or_404(Inbox, id=chat_id, participants=self.request.user)

        # Optional: Enforce 2-participant rule
        if chat.participants.count() != 2:
            raise PermissionDenied("This chat must have exactly two participants.")

        return Message.objects.filter(chat=chat).order_by('timestamp')
    
    
class CreateChatView(APIView):
    def post(self, request, recipient_id):
        sender = request.user
        recipient = get_object_or_404(User, id=recipient_id)
        
        # Try to find an existing inbox
        inbox = Inbox.objects.filter(participants=sender).filter(participants=recipient).first()

        # If no inbox exists, create a new one
        if not inbox:
            unique_key = f"{min(sender.id, recipient.id)}_{max(sender.id, recipient.id)}"
            inbox = Inbox.objects.create(unique_key=unique_key)
            inbox.participants.add(sender, recipient)

        message_text = request.data.get("message")

        if not message_text:
            return Response({"error": "Message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Save the message
        message = Message.objects.create(inbox=inbox, sender=sender, content=message_text)

        # Create notification
        Notification.objects.create(
            user=recipient, sender=sender, notification_type="message", inbox=inbox, message=message_text
        )

        # Send WebSocket notification
        send_message_notification(user=recipient, sender=sender, message=message_text, inbox=inbox)

        return Response({"message": "Message sent successfully.", "inbox_id": inbox.id}, status=status.HTTP_201_CREATED)
        
        
    
    def delete(self, request, chat_id):
        """
        Handles the deletion of a chat room.
        Only participants in the chat are allowed to delete it.
        """
        try:
            chat = Inbox.objects.get(id=chat_id)

            # Check if the requesting user is a participant
            if request.user not in chat.participants.all():
                return Response(
                    {"error": "You do not have permission to delete this chat."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Delete the chat
            chat.delete()
            return Response({"message": "Chat deleted successfully."}, status=status.HTTP_200_OK)

        except Inbox.DoesNotExist:
            return Response({"error": "Chat not found."}, status=status.HTTP_404_NOT_FOUND)
        


class MessageView(APIView):
    """
    Handles message creation and retrieval.
    """

    def get(self, request, chat_id):
        """
        Retrieves all messages in a chat (decrypting them).
        """
        try:
            chat = Inbox.objects.get(id=chat_id, participants=request.user)
        except Inbox.DoesNotExist:
            return Response({"error": "Chat not found or access denied"}, status=403)

        messages = Message.objects.filter(inbox=chat).order_by("timestamp")
        fernet = Fernet(settings.SECRET_KEY.encode())

        decrypted_messages = []
        for msg in messages:
            decrypted_messages.append({
                "id": msg.id,
                "sender": msg.sender.id,
                "message": fernet.decrypt(msg.encrypted_content.encode()).decode(),
                "timestamp": msg.timestamp,
            })

        return Response(decrypted_messages, status=200)

    def post(self, request, chat_id):
        """
        Saves and broadcasts new messages.
        """
        try:
            chat = Inbox.objects.get(id=chat_id, participants=request.user)
        except Inbox.DoesNotExist:
            return Response({"error": "Chat not found or access denied"}, status=403)

        data = request.data
        data["inbox"] = chat.id
        data["sender"] = request.user.id

        serializer = MessageSerializer(data=data)
        if serializer.is_valid():
            message = serializer.save()

            # Send decrypted message to WebSocket clients
            fernet = Fernet(settings.SECRET_KEY.encode())
            decrypted_text = fernet.decrypt(message.encrypted_content.encode()).decode()

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_{chat.id}",
                {
                    "type": "chat_message",
                    "message": decrypted_text,
                    "sender": request.user.id,
                    "chat_id": chat.id,
                },
            )

            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)