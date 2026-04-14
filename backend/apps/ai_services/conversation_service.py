"""
Service for AI-powered mentorship conversations.
"""
import logging
from .gemini_client import GeminiClient
from .prompt_templates import CONVERSATION_PROMPT
from apps.projects.models import Message, Conversation

logger = logging.getLogger(__name__)

class ConversationService:
    """
    Service for handling grounded conversations between AI Mentor and Intern.
    """
    
    def __init__(self):
        self.gemini_client = GeminiClient()

    def get_mentor_response(self, conversation, user_message_content):
        """
        Generates a grounded response from the AI mentor.
        """
        try:
            # 1. Gather context
            project = conversation.project
            task = conversation.task
            history = self._format_history(conversation)
            
            # 2. Extract code context (if any)
            # For now, we'll look at the latest code review of the task or project
            code_snippets = self._get_code_context(conversation)
            
            # 3. Build prompt
            prompt = CONVERSATION_PROMPT.format(
                conversation_history=history,
                project_title=project.title if project else "General Software Development",
                task_title=task.title if task else "Learning Fundamentals",
                task_description=task.description if task else "Understanding senior developer principles",
                code_snippets=code_snippets,
                user_message=user_message_content
            )
            
            # 4. Generate response
            response_text = self.gemini_client.generate_content(prompt)
            
            # 5. Save and return message
            ai_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=response_text
            )
            
            return ai_message

        except Exception as e:
            logger.error(f"Failed to generate mentor response: {str(e)}")
            raise

    def _format_history(self, conversation):
        """Formats recent message history for the prompt."""
        recent_messages = conversation.messages.order_by('-created_at')[:10][::-1]
        history_str = ""
        for msg in recent_messages:
            role = "Intern" if msg.role == 'user' else "Senior Developer"
            history_str += f"{role}: {msg.content}\n"
        return history_str or "No previous messages."

    def _get_code_context(self, conversation):
        """
        Attempts to find relevant code snippets in the database 
        from previous reviews or manual context.
        """
        # Logic: If there is a task, find its latest review
        if conversation.task:
            latest_review = conversation.task.reviews.order_by('-created_at').first()
            if latest_review:
                return f"Recent Diff Context from Task '{conversation.task.title}':\n{latest_review.diff_content[:2000]}"
        
        return "No specific code context available yet. Ask the user for their repository status if needed."
