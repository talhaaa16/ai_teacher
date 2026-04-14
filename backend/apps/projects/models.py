"""
Core models for projects, tasks, code reviews, and conversations.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Project(models.Model):
    """
    Represents a software project assigned to an intern.
    """
    
    PROJECT_STATUS = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    DIFFICULTY_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    
    # Project details
    title = models.CharField(max_length=255)
    description = models.TextField(help_text="AI-generated project brief")
    
    # GitHub repository
    github_repo_url = models.URLField()
    github_repo_full_name = models.CharField(
        max_length=255,
        help_text="Format: username/repository"
    )
    
    # AI context for code review
    tech_stack = models.JSONField(
        default=list,
        help_text="List of technologies: ['Django', 'PostgreSQL', 'Redis']"
    )
    architecture_guidelines = models.TextField(blank=True)
    coding_standards = models.TextField(blank=True)
    
    # Status and metadata
    status = models.CharField(
        max_length=20,
        choices=PROJECT_STATUS,
        default='assigned'
    )
    difficulty_level = models.CharField(
        max_length=20,
        choices=DIFFICULTY_LEVELS,
        default='beginner'
    )
    estimated_duration_hours = models.IntegerField(
        default=40,
        validators=[MinValueValidator(1)]
    )
    
    # Timestamps
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'projects'
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['user', '-assigned_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class Task(models.Model):
    """
    Represents a specific task within a project.
    """
    
    TASK_STATUS = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('revision_required', 'Revision Required'),
        ('approved', 'Approved'),
        ('merged', 'Merged'),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    
    # Task details
    title = models.CharField(max_length=255)
    description = models.TextField()
    acceptance_criteria = models.JSONField(
        default=list,
        help_text="List of criteria that must be met"
    )
    
    # Task ordering and dependencies
    order = models.IntegerField(
        default=0,
        help_text="Sequential order within the project"
    )
    depends_on = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='dependent_tasks'
    )
    
    # GitHub linkage
    github_branch = models.CharField(max_length=255, null=True, blank=True)
    github_pr_number = models.IntegerField(null=True, blank=True)
    github_pr_url = models.URLField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=TASK_STATUS,
        default='assigned'
    )
    
    # AI context
    focus_areas = models.JSONField(
        default=list,
        help_text="Skill areas to focus on: ['validation', 'security', 'error_handling']"
    )
    hints = models.TextField(
        blank=True,
        help_text="AI-generated hints if intern struggles"
    )
    
    # Timestamps
    assigned_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['project', 'order']
        indexes = [
            models.Index(fields=['project', 'order']),
            models.Index(fields=['status', 'assigned_at']),
            models.Index(fields=['github_pr_number']),
        ]
        unique_together = [['project', 'order']]
    
    def __str__(self):
        return f"{self.project.title} - Task {self.order}: {self.title}"


class CodeReview(models.Model):
    """
    Stores AI-generated code reviews for task submissions.
    """
    
    REVIEW_DECISIONS = [
        ('approve', 'Approve'),
        ('request_changes', 'Request Changes'),
        ('comment', 'Comment'),
    ]
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    
    # GitHub PR details
    pr_number = models.IntegerField()
    commit_sha = models.CharField(max_length=40)
    files_changed = models.JSONField(
        default=list,
        help_text="List of file paths that were modified"
    )
    diff_content = models.TextField(
        help_text="Full diff for AI context"
    )
    
    # AI Review results
    ai_feedback = models.TextField(
        help_text="Markdown-formatted feedback from AI"
    )
    review_decision = models.CharField(
        max_length=20,
        choices=REVIEW_DECISIONS
    )
    
    # Detailed analysis
    issues_found = models.JSONField(
        default=list,
        help_text="Structured list of issues with type, severity, file, line, message"
    )
    strengths_identified = models.JSONField(
        default=list,
        help_text="Positive aspects of the code"
    )
    suggestions = models.JSONField(
        default=list,
        help_text="Improvement suggestions"
    )
    
    # Scoring
    code_quality_score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # GitHub integration
    posted_to_github = models.BooleanField(default=False)
    github_review_id = models.BigIntegerField(null=True, blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'code_reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['task', '-created_at']),
            models.Index(fields=['pr_number']),
        ]
    
    def __str__(self):
        return f"Review for {self.task.title} - PR #{self.pr_number}"


class Conversation(models.Model):
    """
    Represents a conversation thread between intern and AI mentor.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
        ]
    
    def __str__(self):
        return f"Conversation {self.id} - {self.user.username}"


class Message(models.Model):
    """
    Individual messages within a conversation.
    """
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # Optional code context for AI responses
    code_context = models.JSONField(
        null=True,
        blank=True,
        help_text="Relevant code snippets referenced in the message"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
