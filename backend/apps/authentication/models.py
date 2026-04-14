"""
Custom User model with GitHub OAuth integration.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from cryptography.fernet import Fernet
from django.conf import settings


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Stores GitHub OAuth data and learning progress metrics.
    """
    
    SKILL_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    # GitHub OAuth fields
    github_id = models.BigIntegerField(unique=True, null=True, blank=True)
    github_username = models.CharField(max_length=255, unique=True, null=True, blank=True)
    github_access_token_encrypted = models.CharField(max_length=500, blank=True)
    avatar_url = models.URLField(null=True, blank=True)
    
    # Learning progress tracking
    skill_level = models.CharField(
        max_length=20,
        choices=SKILL_LEVELS,
        default='beginner'
    )
    strengths = models.JSONField(
        default=dict,
        help_text="Dictionary of skill areas and proficiency scores (0-1)"
    )
    weaknesses = models.JSONField(
        default=dict,
        help_text="Dictionary of skill areas needing improvement"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['github_id']),
            models.Index(fields=['github_username']),
        ]
    
    def __str__(self):
        return self.username or self.github_username or f"User {self.id}"
    
    @property
    def github_access_token(self):
        """Decrypt and return GitHub access token."""
        if not self.github_access_token_encrypted:
            return None
        
        cipher = Fernet(settings.ENCRYPTION_KEY.encode())
        try:
            decrypted = cipher.decrypt(self.github_access_token_encrypted.encode())
            return decrypted.decode()
        except Exception:
            return None
    
    @github_access_token.setter
    def github_access_token(self, value):
        """Encrypt and store GitHub access token."""
        if not value:
            self.github_access_token_encrypted = ''
            return
        
        cipher = Fernet(settings.ENCRYPTION_KEY.encode())
        encrypted = cipher.encrypt(value.encode())
        self.github_access_token_encrypted = encrypted.decode()
    
    def update_strengths_weaknesses(self, skill_area, score):
        """
        Update user's strengths and weaknesses based on performance.
        
        Args:
            skill_area (str): Area of skill (e.g., 'security', 'validation')
            score (float): Performance score 0-1
        """
        if score >= 0.7:
            self.strengths[skill_area] = score
            # Remove from weaknesses if present
            self.weaknesses.pop(skill_area, None)
        elif score < 0.5:
            self.weaknesses[skill_area] = score
        
        self.save(update_fields=['strengths', 'weaknesses', 'updated_at'])
