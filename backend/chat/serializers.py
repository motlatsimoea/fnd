from rest_framework import serializers
from .models import Inbox, Message
from django.contrib.auth import get_user_model


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'profile_picture']
        
    
    def get_profile_picture(self, obj):
        request = self.context.get('request')
        profile = getattr(obj, "profile", None)  # Safely get profile
        if profile and getattr(profile, "profile_picture", None):
            return request.build_absolute_uri(profile.profile_picture.url)
        # Return default avatar for users without a profile
        return request.build_absolute_uri('/media/profile_pictures/default.png')
    
    
class MessageSerializer(serializers.ModelSerializer):
    content = serializers.CharField(write_only=True)  # Accept plaintext for writing
    decrypted_content = serializers.CharField(read_only=True, source='get_content')  # Decrypt for reading
    sender_info = serializers.SerializerMethodField()  # New field for id + username

    class Meta:
        model = Message
        fields = ['id', 'inbox', 'sender', 'sender_info', 'content', 'decrypted_content', 'timestamp']

    def get_sender_info(self, obj):
        request = self.context.get('request')
        
        profile_picture = None
        if hasattr(obj.sender, "profile") and obj.sender.profile.profile_picture:
            profile_picture = request.build_absolute_uri(obj.sender.profile.profile_picture.url)
            
        return {
            "id": obj.sender.id,
            "username": obj.sender.username,
            "profile_picture": profile_picture,
        }
        

    def create(self, validated_data):
        content = validated_data.pop('content')  # Extract plaintext content
        message = Message(**validated_data)
        message.set_content(content)  # Encrypt and save
        message.save()
        return message



class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    unread_count = serializers.IntegerField(read_only=True)
    last_message = serializers.SerializerMethodField()
    current_user = serializers.SerializerMethodField()

    class Meta:
        model = Inbox
        fields = [
            "id",
            "unique_key",
            "participants",
            "last_message",
            "current_user",
            "updated_at",
            "unread_count",
        ]

    def get_last_message(self, obj):
        if not obj.last_message_text:
            return None

        request = self.context.get("request")
        sender = obj.last_message_sender

        profile_picture = None
        if sender and hasattr(sender, "profile") and sender.profile.profile_picture:
            profile_picture = request.build_absolute_uri(
                sender.profile.profile_picture.url
            )

        return {
            "sender_id": sender.id if sender else None,
            "sender_username": sender.username if sender else None,
            "sender_profile_picture": profile_picture,
            "text": obj.last_message_text,
            "timestamp": obj.last_message_at,
        }

    def get_current_user(self, obj):
        request = self.context.get("request")
        return request.user.id if request and request.user else None

    def validate_participants(self, value):
        if len(value) != 2:
            raise serializers.ValidationError(
                "A chat room must have exactly two participants."
            )
        return value

