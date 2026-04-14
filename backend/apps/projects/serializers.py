"""
Serializers for projects app.
"""
from rest_framework import serializers
from .models import Project, Task, CodeReview, Conversation, Message


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model."""
    
    task_count = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'github_repo_url',
            'github_repo_full_name', 'tech_stack', 'architecture_guidelines',
            'coding_standards', 'status', 'difficulty_level',
            'estimated_duration_hours', 'assigned_at', 'completed_at',
            'task_count', 'completed_tasks'
        ]
        read_only_fields = ['id', 'assigned_at', 'completed_at']
    
    def get_task_count(self, obj):
        return obj.tasks.count()
    
    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status__in=['approved', 'merged']).count()


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""
    
    project_title = serializers.CharField(source='project.title', read_only=True)
    latest_review = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_title', 'title', 'description',
            'acceptance_criteria', 'order', 'github_branch',
            'github_pr_number', 'github_pr_url', 'status',
            'focus_areas', 'hints', 'assigned_at', 'submitted_at',
            'approved_at', 'latest_review'
        ]
        read_only_fields = ['id', 'assigned_at', 'submitted_at', 'approved_at']
    
    def get_latest_review(self, obj):
        latest = obj.reviews.first()
        if latest:
            return CodeReviewSerializer(latest).data
        return None


class CodeReviewSerializer(serializers.ModelSerializer):
    """Serializer for CodeReview model."""
    
    class Meta:
        model = CodeReview
        fields = [
            'id', 'task', 'pr_number', 'commit_sha', 'files_changed',
            'ai_feedback', 'review_decision', 'issues_found',
            'strengths_identified', 'suggestions', 'code_quality_score',
            'posted_to_github', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'code_context', 'created_at']
        read_only_fields = ['id', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model."""
    
    messages = MessageSerializer(many=True, read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'project', 'project_title', 'task', 'task_title',
            'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
