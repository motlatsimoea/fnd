from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from chat.serializers import MessageSerializer


def send_inbox_update(message, request=None):
    """
    Send a realtime inbox update to the OTHER participant(s)
    when a new message is created.
    """
    channel_layer = get_channel_layer()

    inbox = message.inbox
    sender = message.sender

    # All participants except sender
    recipients = inbox.participants.exclude(id=sender.id)

    serialized_message = MessageSerializer(
        message,
        context={"request": request}
    ).data

    for user in recipients:
        async_to_sync(channel_layer.group_send)(
            f"inbox_{user.id}",
            {
                "type": "inbox_message",   # handled by InboxConsumer
                "inbox_id": inbox.id,
                "message": serialized_message,
            }
        )
