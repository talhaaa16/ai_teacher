"""
JWT Authentication backend for Django REST Framework.
"""
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework import authentication, exceptions
from apps.authentication.models import User


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT authentication class for DRF.
    """
    
    def authenticate(self, request):
        """
        Authenticate the request and return a two-tuple of (user, token).
        """
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None
        
        try:
            # Expected format: "Bearer <token>"
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                raise exceptions.AuthenticationFailed('Invalid token prefix')
        except ValueError:
            raise exceptions.AuthenticationFailed('Invalid authorization header format')
        
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        
        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')
        
        if not user.is_active:
            raise exceptions.AuthenticationFailed('User is inactive')
        
        return (user, token)


def generate_jwt_token(user):
    """
    Generate JWT token for a user.
    
    Args:
        user: User instance
        
    Returns:
        str: JWT token
    """
    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow(),
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token
