from django.urls import path
from .views import ChatListView, ChatDetailView, CreateChatView, MessageView

urlpatterns = [
    path('', ChatListView.as_view(), name='chat-list'),  # List all chats
    path('<int:chat_id>/', ChatDetailView.as_view(), name='chat-detail'),  # Retrieve messages for a chat
    path('create-chat/', CreateChatView.as_view(), name='create-chat'),  # Create or join a chat
    path('<int:chat_id>/messages/', MessageView.as_view(), name='chat-messages'),  # List & send messages
]

