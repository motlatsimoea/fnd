from django.core.mail import send_mail
from datetime import timedelta
from rest_framework_simplejwt.tokens import AccessToken

def generate_login_token(user):
    # Example token generation (adjust as needed for your setup)
    from rest_framework_simplejwt.tokens import RefreshToken

    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }

def generate_user_token(user):
    """
    Generate a JWT token for the given user.
    """
    token = AccessToken()
    token.set_exp(lifetime=timedelta(hours=24))
    token['user_id'] = user.id  
    return str(token)


def send_activation_email(user, activation_url):
    """
    Send an activation email to the user.
    """
    subject = 'Activate Your Account'
    message = f'Click the link to activate your account: {activation_url}'
    from_email = 'noreply@example.com'
    recipient_list = [user.email]

    send_mail(subject, message, from_email, recipient_list)