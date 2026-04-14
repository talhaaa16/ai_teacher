"""
Handlers for different GitHub webhook events.
"""
from django.utils import timezone
from apps.projects.models import Task
from apps.ai_services.code_review_service import CodeReviewService
import logging

logger = logging.getLogger(__name__)


def handle_pull_request_event(webhook_event):
    """
    Handle pull_request webhook events.
    
    Args:
        webhook_event: WebhookEvent instance
    """
    payload = webhook_event.payload
    action = webhook_event.action
    
    # Only process opened, synchronize, and closed (merged) actions
    if action not in ['opened', 'synchronize', 'closed']:
        logger.info(f"Ignoring PR action: {action}")
        return
    
    pr_data = payload.get('pull_request', {})
    pr_number = pr_data.get('number')
    repo_full_name = payload.get('repository', {}).get('full_name')
    is_merged = pr_data.get('merged', False)
    
    if not pr_number or not repo_full_name:
        logger.error("Missing PR number or repository name in payload")
        return
    
    # Find task associated with this PR
    try:
        task = Task.objects.select_related('project', 'project__user').get(
            github_pr_number=pr_number,
            project__github_repo_full_name=repo_full_name
        )
    except Task.DoesNotExist:
        logger.warning(f"No task found for PR #{pr_number} in {repo_full_name}")
        return
    
    # Update task status based on action
    if action == 'opened':
        task.status = 'submitted'
        task.submitted_at = timezone.now()
        task.save()
    elif action == 'synchronize':
        task.status = 'under_review'
        task.save()
    elif action == 'closed' and is_merged:
        task.status = 'merged'
        task.save()
        
        # Promotion logic: Auto-assign next task
        from apps.ai_services.mentor_service import MentorService
        mentor_service = MentorService()
        mentor_service.promote_task_status(task)
        logger.info(f"Task {task.id} merged. Checking for next task.")
        return # No review needed for merged PR
    
    # Trigger code review for opened or synchronized PRs
    logger.info(f"Triggering code review for task {task.id}, PR #{pr_number}")
    
    # Get user's GitHub access token
    user = task.project.user
    access_token = user.github_access_token
    
    if not access_token:
        logger.error(f"No GitHub access token for user {user.id}")
        return
    
    # Perform code review
    review_service = CodeReviewService()
    review_service.review_pull_request(task, access_token)
