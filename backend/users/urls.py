from django.urls import path
from .views import (
    RegisterView, 
    VerifyOTPView, 
    ProfileView, 
    check_user_exists,
    get_current_user,
    UserSearchView,
)


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('check-user/', check_user_exists, name='check-email'),
    path('me/', get_current_user, name='current-user'),
    path("search/", UserSearchView.as_view(), name="user-search"),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/<str:username>/', ProfileView.as_view(), name='profile_with_username')
]
