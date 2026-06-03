import random
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from users.models import OTP
from users.services.sms_service import send_sms_otp


def generate_otp():
    return str(random.randint(100000, 999999))


def send_email_otp(email, code):
    subject = "Your Verification Code"
    message = f"Your OTP is {code}. It expires in 5 minutes."
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
    )


def send_otp(user):
    # delete old OTPs
    OTP.objects.filter(user=user, is_used=False).delete()

    code = generate_otp()

    OTP.objects.create(user=user, code=code)

    if user.phone_number:
        try:
            send_sms_otp(user.phone_number, code)
            return "phone"
        except Exception as e:
            print("SMS failed:", e)
            raise Exception("Could not send SMS OTP")
    
    send_email_otp(user.email, code)
    return "email"