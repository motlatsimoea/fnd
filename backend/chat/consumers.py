import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from cryptography.fernet import Fernet
from django.conf import settings
from .models import Inbox, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.unique_key = self.scope['url_route']['kwargs']['unique_key']
        self.room_group_name = f"chat_{self.unique_key}"
        user = self.scope["user"]

        print(f"[CONNECT] Attempting WS connection | unique_key={self.unique_key} | user={user}")

        if user.is_anonymous:
            print("[CONNECT] ❌ Connection rejected: anonymous user")
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"[CONNECT] ✅ Connection accepted | group={self.room_group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"[DISCONNECT] Channel removed from group={self.room_group_name} | code={close_code}")

    async def receive(self, text_data):
        """
        Handle an incoming WebSocket message:
        - Save to DB
        - Broadcast to all users in the same chat room
        """
        try:
            data = json.loads(text_data)
            message_text = data.get("message")
            temp_id = data.get("temp_id")
            sender = self.scope["user"]

            print(f"[RECEIVE] Incoming message | sender={sender} | text='{message_text}'")

            # Get inbox (chat)
            chat = await self.get_inbox(self.unique_key)
            print(f"[RECEIVE] ✅ Found chat | id={chat.id}")

            # Save message to DB
            message = await self.create_message(chat, sender, message_text)
            print(f"[RECEIVE] ✅ Message saved | id={message.id} | inbox={chat.id}")

            # Broadcast
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "id": message.id,
                    "temp_id": temp_id,
                    "sender_info": {
                        "id": sender.id,
                        "username": sender.username,
                    },
                    "message": message_text,  # decrypted for frontend
                    "timestamp": message.timestamp.isoformat(),
                }
            )
            print(f"[RECEIVE] 📢 Broadcast sent | message_id={message.id}")

        except Exception as e:
            print(f"[RECEIVE] ❌ ERROR processing message | {str(e)}")

    async def chat_message(self, event):
        """Send broadcasted message to WebSocket"""
        try:
            await self.send(text_data=json.dumps(event))
            print(f"[SEND] Sent to WS | event={event}")
        except Exception as e:
            print(f"[SEND] ❌ ERROR sending to WS | {str(e)}")

    # ---------- DB HELPERS ----------

    @database_sync_to_async
    def get_inbox(self, unique_key):
        return Inbox.objects.get(unique_key=unique_key)

    @database_sync_to_async
    def create_message(self, chat, sender, text):
        return Message.objects.create(
            inbox=chat,
            sender=sender,
            encrypted_content=Fernet(settings.SECRET_KEY_FOR_ENCRYPTION.encode()).encrypt(text.encode()).decode(),
            content="",  # no plaintext stored
        )
