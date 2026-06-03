from django.conf import settings
from twilio.rest import Client


def send_sms_otp(phone_number, code):
    if not settings.TWILIO_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_PHONE:
        raise Exception("Twilio settings are missing")

    client = Client(settings.TWILIO_SID, settings.TWILIO_AUTH_TOKEN)

    message = client.messages.create(
        body=f"Your FND verification code is {code}. It expires in 5 minutes.",
        from_=settings.TWILIO_PHONE,
        to=phone_number,
    )

    return message.sid