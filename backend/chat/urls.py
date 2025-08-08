from django.urls import path
from .views import ChatListView, ChatDetailView, CreateChatView, MessageView

urlpatterns = [
    path('', ChatListView.as_view(), name='chat-list'),
    path('<int:chat_id>/', ChatDetailView.as_view(), name='chat-detail'),
    path('create-chat/<int:recipient_id>/', CreateChatView.as_view(), name='create-chat'),
    path('delete-chat/<int:chat_id>/', CreateChatView.as_view(), name='delete-chat'),
    path('<int:chat_id>/messages/', MessageView.as_view(), name='chat-messages'), 
]
