"""
Mentor service for project assignment and task orchestration.
"""
import json
import logging
from django.db import transaction
from apps.projects.models import Project, Task
from .gemini_client import GeminiClient
from .prompt_templates import COMBINED_GENERATION_PROMPT

logger = logging.getLogger(__name__)

class MentorService:
    """
    Service for AI-driven project management and mentoring logic.
    """
    
    def __init__(self):
        self.gemini_client = GeminiClient()

    def generate_project_for_user(self, user, topic=None, skill_level='beginner'):
        """
        Generates a complete project and task list for a user using a single AI call.
        """
        try:
            # Single AI call for both project and tasks
            all_data = self._generate_project_and_tasks(skill_level, topic)
            project_data = all_data.get('project', {})
            tasks_data = all_data.get('tasks', [])

            with transaction.atomic():
                # Create Project in DB
                title = project_data.get('title', topic or 'AI Generated Project')
                safe_slug = title.lower().replace(' ', '-').replace("'", "")
                
                project = Project.objects.create(
                    user=user,
                    title=title,
                    description=project_data.get('description', 'A learning project.'),
                    tech_stack=project_data.get('tech_stack', ['Django', 'PostgreSQL']),
                    architecture_guidelines=project_data.get('architecture_guidelines', ''),
                    coding_standards=project_data.get('coding_standards', ''),
                    difficulty_level=skill_level,
                    github_repo_full_name=f"{user.github_username}/{safe_slug}",
                    github_repo_url=f"https://github.com/{user.github_username}/{safe_slug}"
                )
                
                # Create Tasks in DB
                created_tasks = []
                for task_info in tasks_data:
                    task = Task.objects.create(
                        project=project,
                        title=task_info.get('title', 'Untitled Task'),
                        description=task_info.get('description', 'No description.'),
                        acceptance_criteria=task_info.get('acceptance_criteria', []),
                        focus_areas=task_info.get('focus_areas', []),
                        order=task_info.get('order', len(created_tasks) + 1),
                        status='assigned'
                    )
                    created_tasks.append(task)

                logger.info(f"Generated project '{project.title}' with {len(created_tasks)} tasks for user {user.username}")
                return project

        except Exception as e:
            logger.error(f"Failed to generate project: {str(e)}")
            raise

    def _generate_project_and_tasks(self, skill_level, topic=None):
        """Single AI call to generate project + tasks together."""
        prompt = COMBINED_GENERATION_PROMPT.format(
            skill_level=skill_level,
            tech_stack="Django, PostgreSQL, Next.js",
            topic=topic or "any practical software project"
        )

        response = self.gemini_client.generate_json_content(prompt)
        return self._parse_json_response(response)

    def _parse_json_response(self, response):
        """Clean and parse JSON from AI response."""
        try:
            if '```json' in response:
                start = response.find('```json') + 7
                end = response.find('```', start)
                response = response[start:end].strip()
            elif '```' in response:
                start = response.find('```') + 3
                end = response.find('```', start)
                response = response[start:end].strip()
            
            return json.loads(response)
        except Exception as e:
            logger.error(f"JSON Parsing failed: {str(e)}")
            raise ValueError(f"AI returned invalid JSON: {response}")

    def promote_task_status(self, task):
        """
        Handle task state transitions and logic as a mentor.
        If a task is approved, assign the next one.
        """
        if task.status == 'approved' or task.status == 'merged':
            next_task = Task.objects.filter(
                project=task.project, 
                order=task.order + 1
            ).first()
            
            if next_task:
                # Mentor assigning next task logic
                logger.info(f"Promoting user to next task: {next_task.title}")
                # We could add an AI generated 'transition message' here
                return next_task
            else:
                # Finished project!
                task.project.status = 'completed'
                task.project.save()
                logger.info(f"Project '{task.project.title}' marked as completed.")
        
        return None
