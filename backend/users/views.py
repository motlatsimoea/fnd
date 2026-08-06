from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Profile, CustomUser, OTP, Sector
from .serializers import ProfileSerializer, UserSerializer, MyTokenObtainPairSerializer, SectorSerializer
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from users.services.otp_service import send_otp, generate_otp
from users.services.otp_service import send_sms_otp

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
        phone_number = request.data.get("phone_number")

        if not email and not phone_number:
            return Response(
                {"detail": "Email or phone number is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if email:
                user = CustomUser.objects.get(email=email)

                token = PasswordResetTokenGenerator().make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                reset_link = f"http://localhost:3000/reset-password/{uid}/{token}/"

                send_mail(
                    "Password Reset",
                    f"Click here to reset your password: {reset_link}",
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                )

                return Response({
                    "detail": "If this email exists, a reset link has been sent.",
                    "channel": "email"
                })

            if phone_number:
                user = CustomUser.objects.get(phone_number=phone_number)

                OTP.objects.filter(user=user, is_used=False).delete()

                code = generate_otp()
                OTP.objects.create(user=user, code=code)

                send_sms_otp(user.phone_number, code)

                return Response({
                    "detail": "If this phone number exists, an OTP has been sent.",
                    "channel": "phone",
                    "user_id": user.id
                })

        except CustomUser.DoesNotExist:
            return Response({
                "detail": "If this account exists, reset instructions have been sent."
            })

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (CustomUser.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Invalid link"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response(
                {"detail": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")

        if not new_password or not confirm_password:
            return Response(
                {"detail": "Password and confirmation are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"detail": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {"detail": e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "Password reset successful"},
            status=status.HTTP_200_OK
        )
    
    
class PhonePasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get("user_id")
        code = request.data.get("code")
        password = request.data.get("password")

        if not user_id or not code or not password:
            return Response(
                {"detail": "user_id, code, and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            otp = OTP.objects.filter(
                user_id=user_id,
                code=code,
                is_used=False
            ).latest("created_at")
        except OTP.DoesNotExist:
            return Response(
                {"detail": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.is_expired():
            return Response(
                {"detail": "OTP expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = otp.user

        try:
            validate_password(password, user)
        except ValidationError as e:
            return Response(
                {"detail": e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.save()

        otp.is_used = True
        otp.save()

        return Response(
            {"detail": "Password reset successful."},
            status=status.HTTP_200_OK
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not current_password or not new_password or not confirm_password:
            return Response(
                {"detail": "All password fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"detail": "New passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {"detail": e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK
        )
        
    
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False
            user.save()

            try:
                channel = send_otp(user)
            except Exception as e:
                user.delete()
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response(
                {
                    "message": f"OTP sent via {channel}. Please verify your account.",
                    "user_id": user.id,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    

@api_view(['POST'])
@permission_classes([AllowAny])
def check_user_exists(request):
    email = request.data.get('email')
    phone = request.data.get('phone_number')

    if email:
        exists = CustomUser.objects.filter(email=email).exists()
        return Response({'exists': exists})

    if phone:
        exists = CustomUser.objects.filter(phone_number=phone).exists()
        return Response({'exists': exists})

    return Response(
        {'detail': 'Email or phone number required'},
        status=400
    )


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get("user_id")
        code = request.data.get("code")

        if not user_id or not code:
            return Response(
                {"error": "user_id and code are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            otp = OTP.objects.filter(
                user_id=user_id,
                code=code,
                is_used=False
            ).latest("created_at")

            if otp.is_expired():
                return Response({"error": "OTP expired"}, status=400)

            # Mark OTP as used
            otp.is_used = True
            otp.save()

            user = otp.user
            user.is_active = True

            if user.phone_number:
                user.is_phone_verified = True
            if user.email:
                user.is_email_verified = True

            user.save()

            return Response(
                {"message": "Account verified successfully"},
                status=status.HTTP_200_OK
            )

        except OTP.DoesNotExist:
            return Response({"error": "Invalid OTP"}, status=400)
        


class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password")
        user = request.user
        
        print("REQUEST DATA:", request.data)
        print("PASSWORD RECEIVED:", password)
        print("USER:", user)
        print("HAS USABLE PASSWORD:", user.has_usable_password())
        print("PASSWORD CHECK:", user.check_password(password))
        

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
    

class SectorListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        
        sectors = Sector.objects.all().order_by("name")
        serializer = SectorSerializer(
            sectors,
            many=True
        )
        return Response(serializer.data)
    

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
