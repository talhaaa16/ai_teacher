"""
Celery tasks for GitHub webhook processing.
"""
from celery import shared_task
from django.utils import timezone
from .models import WebhookEvent
from .webhook_handlers import handle_pull_request_event
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_webhook_event(self, webhook_event_id):
    """
    Process a GitHub webhook event asynchronously.
    
    Args:
        webhook_event_id: ID of WebhookEvent to process
    """
    try:
        webhook_event = WebhookEvent.objects.get(id=webhook_event_id)
        
        # Route to appropriate handler based on event type
        if webhook_event.event_type == 'pull_request':
            handle_pull_request_event(webhook_event)
        else:
            logger.info(f"Ignoring event type: {webhook_event.event_type}")
        
        # Mark as processed
        webhook_event.processed = True
        webhook_event.processed_at = timezone.now()
        webhook_event.save()
        
    except WebhookEvent.DoesNotExist:
        logger.error(f"WebhookEvent {webhook_event_id} not found")
    except Exception as e:
        logger.error(f"Error processing webhook {webhook_event_id}: {str(e)}")
        webhook_event.error_message = str(e)
        webhook_event.save()
        # Retry the task
        raise self.retry(exc=e, countdown=60)


@shared_task
def perform_task_review(task_id):
    """
    Perform an AI code review for a specific task.
    This is used for manual submissions and re-triggering reviews.
    """
    from apps.projects.models import Task
    from apps.ai_services.code_review_service import CodeReviewService
    
    try:
        task = Task.objects.select_related('project', 'project__user').get(id=task_id)
        user = task.project.user
        access_token = user.github_access_token
        
        if not access_token:
            logger.error(f"No GitHub access token for user {user.id}")
            return
        
        if not task.github_pr_number:
            logger.error(f"No PR number for task {task.id}")
            return
            
        review_service = CodeReviewService()
        review_service.review_pull_request(task, access_token)
        logger.info(f"Successfully performed manual review for task {task.id}")
        
    except Task.DoesNotExist:
        logger.error(f"Task {task_id} not found")
    except Exception as e:
        logger.error(f"Error performing manual review for task {task_id}: {str(e)}")
        raise
