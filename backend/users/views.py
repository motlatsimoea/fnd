from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Profile, CustomUser
from .serializers import ProfileSerializer, UserSerializer, MyTokenObtainPairSerializer
from .utils import generate_user_token, send_activation_email
from django.urls import reverse
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)



class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Run the default token generation
        response = super().post(request, *args, **kwargs)

        refresh_token = response.data.get("refresh")
        access_token = response.data.get("access")

        if refresh_token:
            # Remove refresh token from JSON body
            response.data.pop("refresh", None)

            # Store refresh token in HttpOnly cookie
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,      # True in production
                samesite='Lax',     # None allows cross-origin in dev
                max_age=24 * 60 * 60,  # 1 day
                path="/",
            )

        if access_token:
            # Optional: store access token in HttpOnly cookie as well
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite=None,
                max_age=5 * 60,  # 5 minutes
                path="/",
            )

        return response


class MyTokenRefreshCookieView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get("refresh_token")
        if not refresh:
            return Response(
                {"detail": "No refresh token cookie set"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = self.get_serializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)

        data = {"access": serializer.validated_data["access"]}

        # If rotating refresh tokens, update cookie
        if "refresh" in serializer.validated_data:
            data["refresh"] = serializer.validated_data["refresh"]

            response = Response(data)
            response.set_cookie(
                key="refresh_token",
                value=serializer.validated_data["refresh"],
                httponly=True,
                secure=False,      # True in production
                samesite=None,     # None allows cross-origin in dev
                max_age=24 * 60 * 60,
                path="/",
            )
            return response

        # Optional: refresh access token cookie
        response = Response(data)
        response.set_cookie(
            key="access_token",
            value=data["access"],
            httponly=True,
            secure=False,
            samesite=None,
            max_age=5 * 60,
            path="/",
        )

        return response
    
    
class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        print(email)
        if not email:
            return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
            print(user)
            token = PasswordResetTokenGenerator().make_token(user)
            print(token)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            print(uid)

            reset_link = f"http://localhost:3000/reset-password/{uid}/{token}/"
            print(reset_link)
            send_mail(
                "Password Reset",
                f"Click here to reset your password: {reset_link}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
            )
            print("📧 Email sent successfully!")
        except CustomUser.DoesNotExist:
            print("⚠️ No user with that email")
            pass
        except Exception as e:
            print("❌ ERROR:", e)
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"detail": "If this email exists, a reset link has been sent."})
    

class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (CustomUser.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Invalid link"}, status=status.HTTP_400_BAD_REQUEST)

        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get("password")
        if not new_password:
            return Response({"detail": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({"detail": e.messages},status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password reset successful"}, status=status.HTTP_200_OK)


    
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
        
        

class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        password = request.data.get("password")

        if not password or not user.check_password(password):
            return Response(
                {"detail": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_active = False
        user.deactivated_at = timezone.now()
        user.save()

        response = Response(
            {"detail": "Account deactivated. You have 30 days to log back in."},
            status=status.HTTP_200_OK
        )

        # Clear auth cookies
        response.delete_cookie("refresh_token")
        response.delete_cookie("access_token")

        return response
    


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        password = request.data.get("password")

        if not password:
            return Response(
                {"detail": "Password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(password):
            return Response(
                {"detail": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.delete()

        response = Response(
            {"detail": "Account permanently deleted."},
            status=status.HTTP_204_NO_CONTENT
        )

        response.delete_cookie("refresh_token")
        response.delete_cookie("access_token")

        return response
    
    

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, username, request_user):
        """
        Resolve profile either by username (if provided) or current user.
        """
        if username:
            try:
                user = CustomUser.objects.get(username=username)
                return Profile.objects.get(user=user)
            except CustomUser.DoesNotExist:
                raise NotFound({"detail": "User not found"})
            except Profile.DoesNotExist:
                raise NotFound({"detail": "Profile not found for this user"})
        else:
            # Fallback → logged-in user
            return request_user.profile

    def get(self, request, username=None):
        profile = self.get_object(username, request.user)
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, username=None):
        profile = self.get_object(username, request.user)

        # ✅ Ensure only owner can update their profile
        if profile.user != request.user:
            raise PermissionDenied("You cannot edit another user's profile.")

        serializer = ProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    

class UserSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.GET.get("q", "").strip()
        if query:
            users = User.objects.filter(
                username__istartswith=query
            )[:10]
        else:
            users = User.objects.all()[:10]
        return Response([
            {"username": u.username}
            for u in users
        ])
    
 
 
    
class LogoutAndBlacklistRefreshTokenForUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        # Accept either body or cookie
        refresh_token = (
            request.data.get("refresh")
            or request.COOKIES.get("refresh_token") 
        )
        if not refresh_token:
            return Response({"detail": "Refresh token required."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            # Optional: clear cookies on logout
            response = Response(status=status.HTTP_205_RESET_CONTENT)
            response.delete_cookie("refresh_token")
            response.delete_cookie("access_token")
            return response
        except TokenError:
            return Response({"detail": "Token is invalid or already blacklisted."},
                            status=status.HTTP_400_BAD_REQUEST)
