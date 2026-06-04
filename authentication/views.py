from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .models import StudentProfile
from .serializers import (
    StudentRegisterSerializer,
    StudentLoginSerializer,
    ForgotPasswordSerializer
)
from .utils import send_verification_email, verify_token

class StudentRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = StudentRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            "message": "Account successfully created!",
            "unique_student_id": user.student_profile.unique_student_id
        }, status=status.HTTP_201_CREATED)

class EmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token, *args, **kwargs):
        email = verify_token(token)
        if not email:
            return Response({"error": "Invalid or expired verification token."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            profile = user.student_profile
            if not profile.is_verified:
                profile.is_verified = True
                profile.save()
            # Redirect to frontend login page
            return HttpResponseRedirect('/login?verified=true')
        except User.DoesNotExist:
            return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)

class StudentLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = StudentLoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Standard Django Session authentication
        login(request, user)
        
        # Generate or retrieve Token for REST API token authentication
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            "token": token.key,
            "email": user.email,
            "unique_student_id": user.student_profile.unique_student_id
        }, status=status.HTTP_200_OK)

class StudentLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Delete Token if exists
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
            
        # Standard Django Logout (clears session)
        logout(request)
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password successfully reset! You can now log in."}, status=status.HTTP_200_OK)

class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        try:
            unique_student_id = user.student_profile.unique_student_id
            is_verified = user.student_profile.is_verified
        except StudentProfile.DoesNotExist:
            unique_student_id = None
            is_verified = False

        return Response({
            "email": user.email,
            "unique_student_id": unique_student_id,
            "is_verified": is_verified
        }, status=status.HTTP_200_OK)
