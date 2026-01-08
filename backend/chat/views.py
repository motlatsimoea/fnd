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
from django.shortcuts import get_object_or_404



User = get_user_model()

class ChatListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all chats the user is part of
        chats = Inbox.objects.filter(participants=request.user)
        serializer = ChatRoomSerializer(chats, many=True, context={"request": request})
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
    
    
class ChatView(APIView):
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

        # Use helper to create notification + send over WebSocket
        send_message_notification(
            user=recipient,
            sender=sender,
            message=message_text,
            inbox=inbox
        )

        return Response(
            {"message": "Message sent successfully.", "inbox_id": inbox.id},
            status=status.HTTP_201_CREATED
        )
        
    
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
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_id):
        chat = get_object_or_404(Inbox, id=chat_id, participants=request.user)
        messages = Message.objects.filter(inbox=chat).order_by("timestamp")
        fernet = Fernet(settings.SECRET_KEY_FOR_ENCRYPTION.encode())

        result = []
        for msg in messages:
            sender = msg.sender
            profile_picture = (
                request.build_absolute_uri(sender.profile_picture.url)
                if getattr(sender, "profile_picture", None)
                else None
            )
            result.append({
                "id": msg.id,
                "sender_info": {
                    "id": sender.id,
                    "username": sender.username,
                    "profile_picture": profile_picture,
                },
                "message": fernet.decrypt(msg.encrypted_content.encode()).decode(),
                "timestamp": msg.timestamp,
            })
        return Response(result, status=200)

    """
    def post(self, request, chat_id):
        
        Saves a new message and broadcasts it to WebSocket clients.

        chat = get_object_or_404(Inbox, id=chat_id, participants=request.user)

        data = request.data.copy()
        data["inbox"] = chat.id
        data["sender"] = request.user.id

        serializer = MessageSerializer(data=data)
        if serializer.is_valid():
            message = serializer.save()

            # Decrypt the message for WebSocket broadcast
            fernet = Fernet(settings.SECRET_KEY_FOR_ENCRYPTION.encode())
            decrypted_text = fernet.decrypt(message.encrypted_content.encode()).decode()

            # Send to WebSocket clients
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_{chat.unique_key}",
                {
                    "type": "chat_message",
                    "message": decrypted_text,
                    "sender_info": {
                        "id": request.user.id,
                        "username": request.user.username,
                    },
                    "chat_id": chat.id,
                },
            )

            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)
"""

class GetOrCreateChat(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user1 = request.user
        user2 = get_object_or_404(User, id=request.data.get("user2"))

        inbox = Inbox.objects.filter(
            participants=user1
        ).filter(
            participants=user2
        ).first()

        if not inbox:
            unique_key = f"{min(user1.id, user2.id)}_{max(user1.id, user2.id)}"
            inbox = Inbox.objects.create(unique_key=unique_key)
            inbox.participants.add(user1, user2)

        return Response(
            {
                "chat_id": inbox.id,
                "unique_key": inbox.unique_key,
            },
            status=status.HTTP_200_OK,
        )
