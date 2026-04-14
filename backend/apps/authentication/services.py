"""
GitHub OAuth service for authentication.
"""
import requests
from django.conf import settings
from apps.authentication.models import User


class GitHubAuthService:
    """
    Service for handling GitHub OAuth authentication flow.
    """
    
    GITHUB_API_BASE = 'https://api.github.com'
    GITHUB_OAUTH_BASE = 'https://github.com/login/oauth'
    
    @classmethod
    def get_authorization_url(cls):
        """
        Generate GitHub OAuth authorization URL.
        
        Returns:
            str: Authorization URL to redirect user to
        """
        params = {
            'client_id': settings.GITHUB_CLIENT_ID,
            'redirect_uri': settings.GITHUB_REDIRECT_URI,
            'scope': 'read:user user:email repo admin:repo_hook',  
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{cls.GITHUB_OAUTH_BASE}/authorize?{query_string}"
    
    @classmethod
    def exchange_code_for_token(cls, code):
        """
        Exchange authorization code for access token.
        
        Args:
            code (str): Authorization code from GitHub
            
        Returns:
            str: Access token
            
        Raises:
            Exception: If token exchange fails
        """
        response = requests.post(
            f"{cls.GITHUB_OAUTH_BASE}/access_token",
            headers={'Accept': 'application/json'},
            data={
                'client_id': settings.GITHUB_CLIENT_ID,
                'client_secret': settings.GITHUB_CLIENT_SECRET,
                'code': code,
                'redirect_uri': settings.GITHUB_REDIRECT_URI,
            }
        )
        
        response.raise_for_status()
        data = response.json()
        
        if 'error' in data:
            raise Exception(f"GitHub OAuth error: {data.get('error_description', 'Unknown error')}")
        
        return data['access_token']
    
    @classmethod
    def get_user_info(cls, access_token):
        """
        Fetch user information from GitHub API.
        
        Args:
            access_token (str): GitHub access token
            
        Returns:
            dict: User information from GitHub
        """
        response = requests.get(
            f"{cls.GITHUB_API_BASE}/user",
            headers={
                'Authorization': f'token {access_token}',
                'Accept': 'application/json',
            }
        )
        
        response.raise_for_status()
        return response.json()
    
    @classmethod
    def create_or_update_user(cls, github_user_data, access_token):
        """
        Create or update user based on GitHub data.
        
        Args:
            github_user_data (dict): User data from GitHub API
            access_token (str): GitHub access token
            
        Returns:
            User: Created or updated user instance
        """
        github_id = github_user_data['id']
        github_username = github_user_data['login']
        email = github_user_data.get('email') or f"{github_username}@github.user"
        
        # Try to find existing user
        user, created = User.objects.get_or_create(
            github_id=github_id,
            defaults={
                'username': github_username,
                'email': email,
                'github_username': github_username,
                'avatar_url': github_user_data.get('avatar_url'),
            }
        )
        
        if not created:
            user.github_username = github_username
            user.email = email or user.email
            user.avatar_url = github_user_data.get('avatar_url')
        
        user.github_access_token = access_token
        user.save()
        
        return user
