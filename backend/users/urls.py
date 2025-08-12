from django.urls import path
from .views import (
    RegisterView, 
    ActivateAccountView, 
    ProfileView, 
    check_email_exists,
    get_current_user
)


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('check-email/', check_email_exists, name='check-email'),
    path('me/', get_current_user, name='current-user'),
    path('activate/<str:token>/', ActivateAccountView.as_view(), name='activate-account'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/<str:username>/', ProfileView.as_view(), name='profile_with_username')
]
