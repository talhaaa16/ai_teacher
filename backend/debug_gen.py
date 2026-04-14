
import os
import django
import sys

# Set up Django environment
sys.path.append('d:/Projects/AI-Teacher/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.ai_services.mentor_service import MentorService

def test_generation():
    # Use the first user in DB
    user = User.objects.first()
    if not user:
        print("No user found in DB")
        return

    print(f"Testing generation for user: {user.username}")
    service = MentorService()
    try:
        project = service.generate_project_for_user(user, topic="Test Project", skill_level="beginner")
        print(f"Successfully generated project: {project.title}")
    except Exception as e:
        print(f"Generation failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generation()
