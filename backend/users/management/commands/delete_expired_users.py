from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import CustomUser
from datetime import timedelta

class Command(BaseCommand):
    help = "Delete users deactivated for over 30 days"

    def handle(self, *args, **kwargs):
        expired_users = CustomUser.objects.filter(
            is_active=False,
            deactivated_at__lt=timezone.now() - timedelta(days=30)
        )

        count = expired_users.count()
        expired_users.delete()

        self.stdout.write(f"Deleted {count} expired users.")