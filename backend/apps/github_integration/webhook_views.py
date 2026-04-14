"""
GitHub webhook receiver and verification.
"""
import hmac
import hashlib
import json
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import WebhookEvent
from .tasks import process_webhook_event


@method_decorator(csrf_exempt, name='dispatch')
class GitHubWebhookView(APIView):
    """
    Receive and process GitHub webhooks.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Handle incoming GitHub webhook.
        """
        # Get signature from headers
        signature_header = request.headers.get('X-Hub-Signature-256')
        event_type = request.headers.get('X-GitHub-Event')
        
        if not signature_header or not event_type:
            return Response(
                {'error': 'Missing required headers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get raw payload
        payload_body = request.body
        
        # Verify signature
        if not self.verify_signature(payload_body, signature_header):
            return Response(
                {'error': 'Invalid signature'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Parse payload
        try:
            payload = json.loads(payload_body)
        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON payload'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get action if present
        action = payload.get('action', '')
        
        # Log webhook event
        webhook_event = WebhookEvent.objects.create(
            event_type=event_type,
            action=action,
            payload=payload,
            signature=signature_header,
        )
        
        # Process asynchronously with Celery
        process_webhook_event.delay(webhook_event.id)
        
        return Response({'status': 'received'}, status=status.HTTP_200_OK)
    
    @staticmethod
    def verify_signature(payload_body, signature_header):
        """
        Verify GitHub webhook signature using HMAC SHA-256.
        
        Args:
            payload_body (bytes): Raw request body
            signature_header (str): X-Hub-Signature-256 header value
            
        Returns:
            bool: True if signature is valid
        """
        if not settings.GITHUB_WEBHOOK_SECRET:
            # If no secret is configured, skip verification (dev only)
            return True
        
        # Compute expected signature
        secret = settings.GITHUB_WEBHOOK_SECRET.encode('utf-8')
        hash_object = hmac.new(secret, msg=payload_body, digestmod=hashlib.sha256)
        expected_signature = 'sha256=' + hash_object.hexdigest()
        
        # Compare signatures (timing-safe)
        return hmac.compare_digest(expected_signature, signature_header)
