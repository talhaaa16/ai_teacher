from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for custom User model."""
    
    list_display = ['username', 'email', 'github_username', 'skill_level', 'created_at']
    list_filter = ['skill_level', 'is_staff', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'github_username']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('GitHub OAuth', {
            'fields': ('github_id', 'github_username', 'avatar_url')
        }),
        ('Learning Progress', {
            'fields': ('skill_level', 'strengths', 'weaknesses')
        }),
    )
    
    readonly_fields = ['github_access_token_encrypted', 'created_at', 'updated_at']
