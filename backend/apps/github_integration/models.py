"""
Models for GitHub webhook event tracking and processing.
"""
from django.db import models


class WebhookEvent(models.Model):
    """
    Audit log for GitHub webhook events.
    Stores raw payload and processing status.
    """
    
    event_type = models.CharField(
        max_length=100,
        help_text="GitHub event type: pull_request, push, etc."
    )
    action = models.CharField(
        max_length=50,
        blank=True,
        help_text="Event action: opened, synchronize, closed, etc."
    )
    
    # Raw webhook data
    payload = models.JSONField(help_text="Full webhook payload from GitHub")
    signature = models.CharField(max_length=255, help_text="HMAC signature for verification")
    
    # Processing status
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'webhook_events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['processed', 'created_at']),
            models.Index(fields=['event_type', 'action']),
        ]
    
    def __str__(self):
        status = "✓" if self.processed else "⏳"
        return f"{status} {self.event_type}.{self.action} - {self.created_at}"
