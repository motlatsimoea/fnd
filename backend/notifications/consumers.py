import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        try:
            if self.user.is_authenticated:
                self.room_group_name = f"notifications_{self.user.id}"
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                await self.accept()
                await self.send(text_data=json.dumps({
                    "type": "connection_status",
                    "status": "connected",
                    "message": "WebSocket connection established."
                }))
            else:
                await self.send(text_data=json.dumps({
                    "type": "connection_status",
                    "status": "unauthorized",
                    "message": "User is not authenticated."
                }))
                await self.close()
        except Exception as e:
            logger.exception("Error during WebSocket connection:")
            await self.send(text_data=json.dumps({
                "type": "connection_status",
                "status": "error",
                "message": "Failed to connect. Please try again later."
            }))
            await self.close()

    async def disconnect(self, close_code):
        try:
            if hasattr(self, "room_group_name"):
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        except Exception as e:
            logger.exception("Error during WebSocket disconnection:")

    async def send_notification(self, event):
        try:
            await self.send(text_data=json.dumps(event))
        except Exception as e:
            logger.exception("Error sending WebSocket notification:")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Failed to deliver notification."
            }))
