"""
Serializers for authentication app.
"""
from rest_framework import serializers
from apps.authentication.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'github_id',
            'github_username',
            'avatar_url',
            'skill_level',
            'strengths',
            'weaknesses',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
