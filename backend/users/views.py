from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Profile, CustomUser
from .serializers import UserSerializerWithToken, ProfileSerializer, UserSerializer
from .utils import generate_user_token, send_activation_email
from django.urls import reverse
from rest_framework.exceptions import NotFound

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from .serializers import MyTokenObtainPairSerializer


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    

class RegisterView(APIView):
    """
    Handles user registration.
    Sends an email for account activation.
    """
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False  
            user.save()
            
            # Generate an activation token
            token = generate_user_token(user)
            
            # Send activation email
            activation_url = request.build_absolute_uri(
                reverse('activate-account', args=[token])
            )
            send_activation_email(user, activation_url)
            
            return Response({'message': 'User registered. Check your email to activate the account.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class ActivateAccountView(APIView):
    """
    Activates a user account using a token.
    """
    def get(self, request, token):
        try:
            # Decode the token
            access_token = AccessToken(token)
            user_id = access_token.get('user_id')
            
            if not user_id:
                return Response({'error': 'Invalid token structure.'}, status=status.HTTP_400_BAD_REQUEST)

            # Activate the user
            user = CustomUser.objects.get(id=user_id)
            if not user.is_active:
                user.is_active = True
                user.save()
                return Response({'message': 'Account activated successfully.'}, status=status.HTTP_200_OK)
            return Response({'message': 'Account is already active.'}, status=status.HTTP_400_BAD_REQUEST)

        except TokenError as e:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        

"""
class ProfileView(APIView):
    
    #Handles retrieving and updating a user's profile.
    
    #permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


"""

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, username):
        try:
            user = CustomUser.objects.get(username=username)
            return Profile.objects.get(user=user)
        except CustomUser.DoesNotExist:
            raise NotFound({"detail": "User not found"})
        except Profile.DoesNotExist:
            raise NotFound({"detail": "Profile not found for this user"})

    def get(self, request, username=None):
        profile = self.get_object(username or request.user.username)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, username=None):
        profile = self.get_object(username or request.user.username)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)