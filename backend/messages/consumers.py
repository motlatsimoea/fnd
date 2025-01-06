import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Inbox, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        # Add this connection to the room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Remove this connection from the room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        sender_id = data['sender']
        chatroom_id = data['chatroom']

        # Save the message
        sender = await sync_to_async(User.objects.get)(id=sender_id)
        chatroom = await sync_to_async(Inbox.objects.get)(id=chatroom_id)
        await sync_to_async(Message.objects.create)(
            sender=sender,
            chatroom=chatroom,
            content=message,
        )

        # Broadcast the message to the group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender.username,
            }
        )

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']

        # Send the message to the WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
        }))
