from rest_framework import serializers
from .models import Inbox, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    content = serializers.CharField(write_only=True)  # Accept plaintext for writing
    decrypted_content = serializers.CharField(read_only=True, source='get_content')  # Decrypt for reading

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'content', 'decrypted_content', 'timestamp']

    def create(self, validated_data):
        content = validated_data.pop('content')  # Extract plaintext content
        message = Message(**validated_data)
        message.set_content(content)  # Encrypt and save
        message.save()
        return message


class ChatRoomSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Inbox
        fields = ['id', 'participants', 'messages']

    def validate_participants(self, value):
        if len(value) != 2:
            raise serializers.ValidationError("A chat room must have exactly two participants.")
        return value
