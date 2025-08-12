from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.http import HttpResponseRedirect
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Profile, CustomUser
from .serializers import UserSerializerWithToken, ProfileSerializer, UserSerializer
from .utils import generate_user_token, send_activation_email
from django.urls import reverse
from rest_framework.exceptions import NotFound
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .serializers import MyTokenObtainPairSerializer, UserSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        # Run the normal token generation logic
        response = super().post(request, *args, **kwargs)

        refresh_token = response.data.get("refresh")
        if refresh_token:
            # Remove refresh from the JSON body
            del response.data["refresh"]

            # Set it in an HttpOnly cookie
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=not settings.DEBUG,  # only send over HTTPS in production
                samesite="Strict",          # or "Lax" if you need cross-site
                max_age=24 * 60 * 60,       # 1 day in seconds
            )

        return response
    

class MyTokenRefreshCookieView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get("refresh_token")
        if not refresh:
            raise InvalidToken("No refresh token cookie set")
        
        serializer = self.get_serializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)

        # Access token is returned in JSON
        return Response({"access": serializer.validated_data["access"]})

class RegisterView(APIView):
    
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False
            user.save()

            token = generate_user_token(user)
            activation_url = request.build_absolute_uri(
                reverse('activate-account', args=[token])
            )

            send_activation_email(user, activation_url)

            return Response(
                {'message': 'User registered. Check your email to activate the account.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    

@api_view(['POST'])
@permission_classes([AllowAny])
def check_email_exists(request):
    email = request.data.get('email')
    if not email:
        return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    exists = User.objects.filter(email=email).exists()
    return Response({'exists': exists}, status=status.HTTP_200_OK)



class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            access_token = AccessToken(token)
            user_id = access_token.get('user_id')

            if not user_id:
                return Response({'error': 'Invalid token structure.'}, status=status.HTTP_400_BAD_REQUEST)

            user = CustomUser.objects.get(id=user_id)
            if not user.is_active:
                user.is_active = True
                user.save()
                # Redirect to frontend login page
                return HttpResponseRedirect(redirect_to='http://localhost:3000/login')
            return HttpResponseRedirect(redirect_to='http://localhost:3000/login?already_active=true')

        except TokenError:
            return HttpResponseRedirect(redirect_to='http://localhost:3000/login?error=token_invalid')
        except CustomUser.DoesNotExist:
            return HttpResponseRedirect(redirect_to='http://localhost:3000/login?error=user_not_found')
        
        

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
    
    
class LogoutAndBlacklistRefreshTokenForUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"detail": "Token is invalid or already blacklisted."}, status=status.HTTP_400_BAD_REQUEST)