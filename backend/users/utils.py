
from rest_framework_simplejwt.tokens import RefreshToken

def generate_login_token(user):
    # Example token generation (adjust as needed for your setup)
    

    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }
