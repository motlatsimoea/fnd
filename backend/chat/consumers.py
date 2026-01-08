import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from cryptography.fernet import Fernet
from django.conf import settings
from .models import Inbox, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.unique_key = self.scope["url_route"]["kwargs"]["unique_key"]
        self.room_group_name = f"chat_{self.unique_key}"
        self.user = self.scope["user"]

        print(f"[CONNECT] Attempting WS | key={self.unique_key} | user={self.user}")

        # Reject anonymous users
        if self.user.is_anonymous:
            print("[CONNECT] ❌ Anonymous user")
            await self.close()
            return

        # Ensure user is a participant
        if not await self.user_in_chat(self.user, self.unique_key):
            print("[CONNECT] ❌ User not a participant")
            await self.close()
            return

        # Resolve inbox once
        try:
            self.chat = await self.get_inbox(self.unique_key)
        except Inbox.DoesNotExist:
            print("[CONNECT] ❌ Inbox not found")
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )

        await self.accept()
        print(f"[CONNECT] ✅ Connected | group={self.room_group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )
        print(f"[DISCONNECT] group={self.room_group_name} | code={close_code}")

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

            # Validate message
            if not message_text or not message_text.strip():
                print("[RECEIVE] ❌ Empty message ignored")
                return

            print(f"[RECEIVE] From {self.user}: {message_text}")

            # Save message
            message = await self.create_message(
                chat=self.chat,
                sender=self.user,
                text=message_text,
            )

            print(f"[RECEIVE] ✅ Saved message id={message.id}")

            # Broadcast to room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "id": message.id,
                    "temp_id": temp_id,
                    "sender_info": {
                        "id": self.user.id,
                        "username": self.user.username,
                    },
                    "message": message_text,
                    "timestamp": message.timestamp.isoformat(),
                },
            )

            print(f"[RECEIVE] 📢 Broadcast sent")

        except Exception as e:
            print(f"[RECEIVE] ❌ ERROR: {str(e)}")

    async def chat_message(self, event):
        try:
            await self.send(text_data=json.dumps(event))
            print(f"[SEND] Delivered | id={event.get('id')}")
        except Exception as e:
            print(f"[SEND] ❌ ERROR sending | {str(e)}")

    # ---------- DB HELPERS ----------

    @database_sync_to_async
    def user_in_chat(self, user, unique_key):
        return Inbox.objects.filter(
            unique_key=unique_key,
            participants=user
        ).exists()

    @database_sync_to_async
    def get_inbox(self, unique_key):
        return Inbox.objects.get(unique_key=unique_key)

    @database_sync_to_async
    def create_message(self, chat, sender, text):
        return Message.objects.create(
            inbox=chat,
            sender=sender,
            encrypted_content=Fernet(
                settings.SECRET_KEY_FOR_ENCRYPTION.encode()
            ).encrypt(text.encode()).decode(),
            content="",  # no plaintext stored
        )