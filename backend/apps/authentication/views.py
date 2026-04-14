"""
Authentication views for GitHub OAuth and user management.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import redirect
from django.conf import settings

from .services import GitHubAuthService
from .authentication import generate_jwt_token
from .serializers import UserSerializer


class GitHubLoginView(APIView):
    """
    Initiate GitHub OAuth flow.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Redirect to GitHub authorization page."""
        auth_url = GitHubAuthService.get_authorization_url()
        return Response({
            'authorization_url': auth_url
        })


class GitHubCallbackView(APIView):
    """
    Handle GitHub OAuth callback.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Exchange code for token and create/update user.
        """
        code = request.GET.get('code')
        
        if not code:
            return Response(
                {'error': 'No authorization code provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Exchange code for access token
            access_token = GitHubAuthService.exchange_code_for_token(code)
            
            # Get user info from GitHub
            github_user_data = GitHubAuthService.get_user_info(access_token)
            
            # Create or update user
            user = GitHubAuthService.create_or_update_user(
                github_user_data,
                access_token
            )
            
            # Generate JWT token
            jwt_token = generate_jwt_token(user)
            
            # Redirect to frontend with token
            frontend_url = settings.FRONTEND_URL
            redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}"
            
            return redirect(redirect_url)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CurrentUserView(APIView):
    """
    Get current authenticated user details.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return current user data."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    """
    Logout user (client-side token deletion).
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Logout endpoint.
        Note: JWT tokens are stateless, so logout is handled client-side.
        """
        return Response({
            'message': 'Logged out successfully'
        })
