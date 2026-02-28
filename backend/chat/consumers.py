import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from cryptography.fernet import Fernet
from django.conf import settings
from .models import Inbox, Message
from notifications.utils import send_message_notification


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.unique_key = self.scope["url_route"]["kwargs"]["unique_key"]
        self.room_group_name = f"chat_{self.unique_key}"
        self.user = self.scope["user"]
        print("=== CHAT CONNECT START ===")
        print("User:", self.scope["user"])
        print("Unique key:", self.unique_key)
        print("Query string:", self.scope["query_string"])

        print(f"[CONNECT] Attempting WS | key={self.unique_key} | user={self.user}")

        # ❌ Reject anonymous users
        if self.user.is_anonymous:
            print("[CONNECT] ❌ Anonymous user")
            await self.close()
            return

        # ❌ Ensure user is a participant
        if not await self.user_in_chat(self.user, self.unique_key):
            print("[CONNECT] ❌ User not a participant")
            await self.close()
            return

        # ❌ Resolve inbox
        try:
            self.chat = await self.get_inbox(self.unique_key)
        except Inbox.DoesNotExist:
            print("[CONNECT] ❌ Inbox not found")
            await self.close()
            return

        # ✅ Join chat group
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
        Incoming WebSocket message:
        - Validate
        - Save message
        - Create inbox notification (recipient only)
        - Broadcast to chat group
        """
        try:
            data = json.loads(text_data)
            message_text = data.get("message")
            temp_id = data.get("temp_id")

            # ❌ Ignore empty messages
            if not message_text or not message_text.strip():
                print("[RECEIVE] ❌ Empty message ignored")
                return

            print(f"[RECEIVE] From {self.user}: {message_text}")

            # ✅ Save message
            message = await self.create_message(
                chat=self.chat,
                sender=self.user,
                text=message_text,
            )

            print(f"[RECEIVE] ✅ Saved message id={message.id}")
            
            await self.mark_inbox_unread(self.chat, self.user, message_text, message)

            # ✅ Determine recipient (1–1 inbox)
            recipient = await self.get_recipient(self.chat, self.user)

            # 🔔 Create inbox notification (recipient only)
            if recipient and recipient.id != self.user.id:
                await sync_to_async(send_message_notification)(
                    user=recipient,
                    sender=self.user,
                    message=message_text[:80],  # preview text
                    inbox=self.chat,
                )
                print("[RECEIVE] 🔔 Inbox notification created")
            else:
                print("[RECEIVE] ⚠️ No valid recipient for notification")
                
                
            if recipient:
                await self.channel_layer.group_send(
                    f"inbox_{recipient.id}",
                    {
                        "type": "inbox_message",
                        "inbox_id": self.chat.id,
                    }
                )

            # 📢 Broadcast message to chat room
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

            print("[RECEIVE] 📢 Broadcast sent")

        except Exception as e:
            print(f"[RECEIVE] ❌ ERROR: {str(e)}")

    async def chat_message(self, event):
        """Send message payload to WebSocket client"""
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
    def get_recipient(self, inbox, sender):
        return inbox.participants.exclude(id=sender.id).first()

    @database_sync_to_async
    def create_message(self, chat, sender, text):
        return Message.objects.create(
            inbox=chat,
            sender=sender,
            encrypted_content=Fernet(
                settings.SECRET_KEY_FOR_ENCRYPTION.encode()
            ).encrypt(text.encode()).decode(),
            content="",  # plaintext intentionally not stored
        )
        
    @database_sync_to_async
    def mark_inbox_unread(self, inbox, sender, message_text, message):
        recipients = inbox.participants.exclude(id=sender.id)

        # mark unread
        inbox.unread_by.add(*recipients)

        # update inbox metadata (NEW MODEL)
        inbox.last_message_text = message.get_content()
        inbox.last_message_sender = sender
        inbox.last_message_at = message.timestamp
        inbox.updated_at = message.timestamp
        
        inbox.save()


class InboxConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        print(f"[INBOX CONNECT] user={self.user}")
        
        if self.user.is_anonymous:
            print("[INBOX CONNECT] ❌ anonymous user – closing")
            await self.close()
            return

        self.group_name = f"inbox_{self.user.id}"
        print(f"[INBOX CONNECT] joining group {self.group_name}")

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        print("[INBOX CONNECT] ✅ accepted")

    async def disconnect(self, close_code):
        print(f"[INBOX DISCONNECT] user={self.user} code={close_code}")
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def inbox_message(self, event):
        """
        Fired when a new message arrives in ANY inbox
        """
        print(f"[INBOX MESSAGE] event={event}")
        await self.send(text_data=json.dumps({
            "event": "inbox_message",
            "inbox_id": event["inbox_id"],
        }))