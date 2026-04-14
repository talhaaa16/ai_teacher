"""
URL routing for GitHub webhook integration.
"""
from django.urls import path
from .webhook_views import GitHubWebhookView

app_name = 'github_integration'

urlpatterns = [
    path('', GitHubWebhookView.as_view(), name='webhook'),
]
