from rest_framework.views import APIView
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from .models import Inbox, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from django.contrib.auth import get_user_model

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
        # Fetch messages for a specific chat
        chat_id = self.kwargs['chat_id']
        return Message.objects.filter(chat_id=chat_id).order_by('timestamp')
    
    
class CreateChatView(APIView):
    """
    Handles the creation of a new chat room or retrieves an existing chat room.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        participants = request.data.get('participants')  # List of user IDs

        if not participants:
            return Response({"error": "Participants are required"}, status=400)

        # Add the requesting user to the participants list
        participants.append(request.user.id)
        participants = list(set(participants))  # Remove duplicates

        # Ensure all participants exist
        try:
            participant_objects = User.objects.filter(id__in=participants)
            if participant_objects.count() != len(participants):
                return Response({"error": "Some users do not exist"}, status=400)
        except User.DoesNotExist:
            return Response({"error": "Invalid user IDs provided"}, status=400)

        # Check if a chat with these exact participants already exists
        existing_chat = Inbox.objects.annotate(participant_count=Count('participants')) \
                                     .filter(participants__id__in=participants) \
                                     .distinct() \
                                     .filter(participant_count=len(participants))

        if existing_chat.exists():
            return Response({"chat_id": existing_chat.first().id}, status=200)

        # Create a new chat room
        new_chat = Inbox.objects.create()
        new_chat.participants.add(*participant_objects)
        return Response({"chat_id": new_chat.id}, status=201)
    
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
    View for handling messages in a chat.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_id):
        try:
            chat = Inbox.objects.get(id=chat_id, participants=request.user)
        except Inbox.DoesNotExist:
            return Response({"error": "Chat not found or access denied"}, status=403)

        messages = chat.messages.all().order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=200)

    def post(self, request, chat_id):
        try:
            chat = Inbox.objects.get(id=chat_id, participants=request.user)
        except Inbox.DoesNotExist:
            return Response({"error": "Chat not found or access denied"}, status=403)

        data = request.data
        data['chat'] = chat.id
        data['sender'] = request.user.id

        serializer = MessageSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)