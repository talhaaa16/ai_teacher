"""
Views for projects app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Project, Task, CodeReview, Conversation, Message
from .serializers import (
    ProjectSerializer, TaskSerializer, CodeReviewSerializer,
    ConversationSerializer, MessageSerializer
)
from apps.ai_services.mentor_service import MentorService
from apps.ai_services.code_review_service import CodeReviewService


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project model."""
    
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """AI-powered project and task generation."""
        topic = request.data.get('topic')
        skill_level = request.data.get('skill_level', 'beginner')
        
        mentor_service = MentorService()
        try:
            project = mentor_service.generate_project_for_user(
                user=request.user,
                topic=topic,
                skill_level=skill_level
            )
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task model."""
    
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Task.objects.filter(project__user=self.request.user)
        
        # Filter by project if specified
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by status if specified
        task_status = self.request.query_params.get('status')
        if task_status:
            queryset = queryset.filter(status=task_status)
        
        return queryset.select_related('project').prefetch_related('reviews')
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Mark task as submitted."""
        task = self.get_object()
        
        # Validate PR URL is provided
        pr_url = request.data.get('github_pr_url')
        pr_number = request.data.get('github_pr_number')
        
        if not pr_url or not pr_number:
            return Response(
                {'error': 'github_pr_url and github_pr_number are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.github_pr_url = pr_url
        task.github_pr_number = pr_number
        task.status = 'submitted'
        task.save()
        
        # Trigger AI review asynchronously
        from apps.github_integration.tasks import perform_task_review
        perform_task_review.delay(task.id)
        
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Manually trigger a code review."""
        task = self.get_object()
        
        if not task.github_pr_number:
            return Response(
                {'error': 'No PR found for this task. Submit a PR URL first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        task.status = 'under_review'
        task.save()
        
        # Trigger AI review asynchronously
        from apps.github_integration.tasks import perform_task_review
        perform_task_review.delay(task.id)
        
        return Response({'status': 'Review initiated'})


class CodeReviewViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for CodeReview model (read-only)."""
    
    serializer_class = CodeReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = CodeReview.objects.filter(task__project__user=self.request.user)
        
        # Filter by task if specified
        task_id = self.request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        
        return queryset.select_related('task', 'task__project')


class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for Conversation model."""
    
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user).prefetch_related('messages')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in the conversation."""
        conversation = self.get_object()
        
        content = request.data.get('content')
        if not content:
            return Response(
                {'error': 'content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user message
        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=content
        )
        
        from apps.ai_services.conversation_service import ConversationService
        conv_service = ConversationService()
        
        try:
            ai_message = conv_service.get_mentor_response(conversation, content)
            return Response(ConversationSerializer(conversation).data)
        except Exception as e:
            # Fallback message
            ai_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=f"I'm sorry, I'm having trouble processing that right now. Error: {str(e)}"
            )
            return Response(ConversationSerializer(conversation).data)
