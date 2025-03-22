import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Inbox, Message
from cryptography.fernet import Fernet
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.unique_key = self.scope['url_route']['kwargs']['unique_key']
        self.room_group_name = f"chat_{self.unique_key}"

        # Add this connection to the room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Remove this connection from the room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data['message']
        sender_id = data['sender']
        
        # Encrypt message before saving
        fernet = Fernet(settings.SECRET_KEY_FOR_ENCRYPTION.encode())
        encrypted_text = fernet.encrypt(message_text.encode()).decode()
        
        # Save the message
        sender = await sync_to_async(User.objects.get)(id=sender_id)
        chat = await sync_to_async(Inbox.objects.get)(id=self.unique_key)
        
        # Save encrypted message
        message = await sync_to_async(Message.objects.create)(
            inbox=chat,
            sender=sender,
            encrypted_content=encrypted_text,
            content="", # Prevent storing plain text
        )
        # Send decrypted message to WebSocket clients
        decrypted_text = fernet.decrypt(encrypted_text.encode()).decode()

        # Broadcast the message to the group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": decrypted_text,
                "sender": sender_id,
                "unique_key": self.unique_key,
            }
        )

    async def chat_message(self, event):
        """
        Sends decrypted messages to WebSocket clients.
        """
        await self.send(text_data=json.dumps(event))
