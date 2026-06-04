from django.urls import path
from .views import (
    StudentRegisterView,
    EmailVerificationView,
    StudentLoginView,
    StudentLogoutView,
    ForgotPasswordView,
    UserMeView
)

urlpatterns = [
    path('register/', StudentRegisterView.as_view(), name='register'),
    path('verify-email/<str:token>/', EmailVerificationView.as_view(), name='verify-email'),
    path('login/', StudentLoginView.as_view(), name='login'),
    path('logout/', StudentLogoutView.as_view(), name='logout'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('me/', UserMeView.as_view(), name='me'),
]
