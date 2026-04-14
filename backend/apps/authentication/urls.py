"""
URL routing for authentication app.
"""
from django.urls import path
from .views import (
    GitHubLoginView,
    GitHubCallbackView,
    CurrentUserView,
    LogoutView,
)

app_name = 'authentication'

urlpatterns = [
    path('github/login/', GitHubLoginView.as_view(), name='github-login'),
    path('github/callback/', GitHubCallbackView.as_view(), name='github-callback'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
