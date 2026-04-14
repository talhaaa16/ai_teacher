from django.contrib import admin
from .models import WebhookEvent


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'event_type', 'action', 'processed', 'created_at']
    list_filter = ['event_type', 'action', 'processed', 'created_at']
    search_fields = ['event_type', 'action', 'error_message']
    readonly_fields = ['created_at', 'processed_at']
    
    def has_add_permission(self, request):
        # Webhook events are created automatically, not manually
        return False
