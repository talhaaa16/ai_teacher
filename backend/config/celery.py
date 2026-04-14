"""
Celery configuration for AI Teacher project.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('ai_teacher')

# Load config from Django settings with CELERY namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()

# Celery Beat Schedule (Periodic Tasks)
app.conf.beat_schedule = {
    'check-stale-prs': {
        'task': 'apps.github_integration.tasks.check_stale_pull_requests',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
    'update-user-progress': {
        'task': 'apps.ai_services.tasks.update_all_user_progress',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
