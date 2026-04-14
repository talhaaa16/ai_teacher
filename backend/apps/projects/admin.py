from django.contrib import admin
from .models import Project, Task, CodeReview, Conversation, Message


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'difficulty_level', 'assigned_at']
    list_filter = ['status', 'difficulty_level', 'assigned_at']
    search_fields = ['title', 'user__username', 'github_repo_full_name']
    readonly_fields = ['assigned_at', 'completed_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'order', 'status', 'assigned_at']
    list_filter = ['status', 'assigned_at']
    search_fields = ['title', 'project__title']
    readonly_fields = ['assigned_at', 'submitted_at', 'approved_at']
    ordering = ['project', 'order']


@admin.register(CodeReview)
class CodeReviewAdmin(admin.ModelAdmin):
    list_display = ['task', 'pr_number', 'review_decision', 'code_quality_score', 'created_at']
    list_filter = ['review_decision', 'posted_to_github', 'created_at']
    search_fields = ['task__title', 'pr_number']
    readonly_fields = ['created_at']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'project', 'task', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'role', 'content_preview', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['content']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'
