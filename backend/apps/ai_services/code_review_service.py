"""
Code review service using Gemini AI.
"""
import json
from django.utils import timezone
from apps.projects.models import CodeReview
from apps.github_integration.github_client import GitHubAPIClient
from .gemini_client import GeminiClient
from .prompt_templates import CODE_REVIEW_PROMPT
import logging

logger = logging.getLogger(__name__)


class CodeReviewService:
    """
    Service for performing AI-powered code reviews.
    """
    
    def __init__(self):
        self.gemini_client = GeminiClient()
    
    def review_pull_request(self, task, access_token):
        """
        Perform code review on a pull request.
        
        Args:
            task: Task instance
            access_token: GitHub access token
        """
        try:
            # Initialize GitHub client
            github_client = GitHubAPIClient(access_token)
            
            # Get PR details
            repo_full_name = task.project.github_repo_full_name
            pr_number = task.github_pr_number
            
            pr_data = github_client.get_pull_request(repo_full_name, pr_number)
            pr_diff = github_client.get_pull_request_diff(repo_full_name, pr_number)
            pr_files = github_client.get_pull_request_files(repo_full_name, pr_number)
            
            # Get file contents
            file_contents = self._get_file_contents(
                github_client,
                repo_full_name,
                pr_files,
                pr_data['head']['sha']
            )
            
            # Build review prompt
            prompt = self._build_review_prompt(task, pr_diff, file_contents)
            
            # Get AI review
            logger.info(f"Requesting AI review for task {task.id}")
            ai_response = self.gemini_client.generate_json_content(prompt)
            
            # Parse AI response
            review_data = self._parse_review_response(ai_response)
            
            # Apply the "85% Rule": If score is 85+ and no critical/high issues, auto-approve
            original_decision = review_data.get('decision')
            score = review_data.get('code_quality_score', 0)
            issues = review_data.get('issues', [])
            has_major_issues = any(i.get('severity') in ['critical', 'high'] for i in issues)
            
            if (original_decision == 'REQUEST_CHANGES' or original_decision == 'COMMENT') and score >= 85 and not has_major_issues:
                logger.info(f"Applying 85% Rule for task {task.id}: Score {score} with only minor issues. Upgrading to APPROVE.")
                review_data['decision'] = 'APPROVE'
                # Prepend the rule notice to general feedback
                current_feedback = review_data.get('general_feedback', '')
                review_data['general_feedback'] = f"⚡ **85% Rule Applied:** Although there are a few minor suggestions, your overall code quality is excellent ({score}/100). I am approving and merging this PR so you can move forward!\n\n{current_feedback}"
            
            # Create CodeReview record
            code_review = CodeReview.objects.create(
                task=task,
                pr_number=pr_number,
                commit_sha=pr_data['head']['sha'],
                files_changed=[f['filename'] for f in pr_files],
                diff_content=pr_diff,
                ai_feedback=review_data.get('general_feedback', ''),
                review_decision=self._map_decision(review_data.get('decision')),
                issues_found=review_data.get('issues', []),
                strengths_identified=review_data.get('strengths', []),
                suggestions=review_data.get('issues', []),  # Issues contain suggestions
                code_quality_score=review_data.get('code_quality_score'),
            )
            
            # Post review to GitHub
            self._post_review_to_github(
                github_client,
                repo_full_name,
                pr_number,
                pr_data['head']['sha'],
                review_data,
                code_review
            )
            

            # Update task status and handle merging
            if review_data.get('decision') == 'APPROVE':
                task.status = 'approved'
                task.approved_at = timezone.now()
                task.save()
                
                # Check for auto-merge
                # For now, we'll try to auto-merge if AI approves
                try:
                    logger.info(f"AI Approved task {task.id}. Attempting auto-merge for PR #{pr_number}")
                    merge_result = github_client.merge_pull_request(
                        repo_full_name=repo_full_name,
                        pr_number=pr_number,
                        commit_title=f"AI Mentor: Approving {task.title}",
                        commit_message=f"Task {task.id} has been reviewed and approved by the AI Senior Mentor."
                    )
                    
                    if merge_result.get('merged'):
                        task.status = 'merged'
                        task.save()
                        logger.info(f"Successfully auto-merged PR #{pr_number} for task {task.id}")
                        
                        # Add a confirmation message to the feedback
                        review_data['general_feedback'] += "\n\n🚀 **Action Taken:** Your code is perfect for this task. I have automatically merged this Pull Request. Excellent work!"
                    else:
                        review_data['general_feedback'] += f"\n\n🟡 **Status:** I've approved your PR, but there was a minor issue with the auto-merge: {merge_result.get('message', 'Unknown error')}. You can go ahead and merge it manually on GitHub!"
                except Exception as merge_err:
                    logger.error(f"Failed to auto-merge PR #{pr_number}: {str(merge_err)}")
                    review_data['general_feedback'] += f"\n\n🟡 **Status:** I've approved your code! However, I couldn't merge it automatically due to a GitHub error. You can merge it manually now."
            else:
                task.status = 'revision_required'
                task.save()
                review_data['general_feedback'] += "\n\n🛠️ **Suggested Action:** Please review the issues I've highlighted above and submit your changes. I will re-review once you push the fixes!"

            # Re-update the CodeReview record with modified feedback if needed
            code_review.ai_feedback = review_data.get('general_feedback', '')
            code_review.save()
            
            logger.info(f"Code review completed for task {task.id}. Final Status: {task.status}")
            
        except Exception as e:
            logger.error(f"Error reviewing PR for task {task.id}: {str(e)}")
            raise
    
    def _get_file_contents(self, github_client, repo_full_name, pr_files, commit_sha):
        """Get contents of modified files."""
        file_contents = {}
        
        # Limit to first 10 files to avoid token limits
        for file_data in pr_files[:10]:
            filename = file_data['filename']
            try:
                content = github_client.get_file_content(
                    repo_full_name,
                    filename,
                    ref=commit_sha
                )
                file_contents[filename] = content
            except Exception as e:
                logger.warning(f"Could not fetch {filename}: {str(e)}")
                file_contents[filename] = "[Could not fetch file content]"
        
        return file_contents
    
    def _build_review_prompt(self, task, pr_diff, file_contents):
        """Build the code review prompt."""
        project = task.project
        
        # Format file contents
        file_contents_str = "\n\n".join([
            f"**File: {filename}**\n```\n{content}\n```"
            for filename, content in file_contents.items()
        ])
        
        # Format acceptance criteria
        criteria_str = "\n".join([
            f"- {criterion}"
            for criterion in task.acceptance_criteria
        ])
        
        # Format focus areas
        focus_str = ", ".join(task.focus_areas) if task.focus_areas else "General code quality"
        
        # Format tech stack
        tech_stack_str = ", ".join(project.tech_stack) if project.tech_stack else "Not specified"
        
        prompt = CODE_REVIEW_PROMPT.format(
            project_title=project.title,
            tech_stack=tech_stack_str,
            task_title=task.title,
            task_description=task.description,
            acceptance_criteria=criteria_str,
            coding_standards=project.coding_standards or "Follow language best practices",
            focus_areas=focus_str,
            pr_diff=pr_diff[:15000],  # Limit diff size
            file_contents=file_contents_str[:10000],  # Limit content size
        )
        
        return prompt
    
    def _parse_review_response(self, ai_response):
        """Parse JSON response from AI."""
        cleaned_response = ai_response.strip()
        
        try:
            # 1. Try to extract JSON from markdown code blocks
            if '```json' in cleaned_response:
                start = cleaned_response.find('```json') + 7
                end = cleaned_response.find('```', start)
                json_str = cleaned_response[start:end].strip()
            elif '```' in cleaned_response:
                start = cleaned_response.find('```') + 3
                end = cleaned_response.find('```', start)
                json_str = cleaned_response[start:end].strip()
            else:
                # 2. Fallback: Search for the outermost curly braces
                import re
                match = re.search(r'\{.*\}', cleaned_response, re.DOTALL)
                if match:
                    json_str = match.group(0)
                else:
                    json_str = cleaned_response
            
            return json.loads(json_str)
            
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"Failed to parse AI response: {str(e)}")
            logger.error(f"Response: {ai_response}")
            # Return a default structure
            return {
                'decision': 'COMMENT',
                'summary': 'Review completed but response parsing failed',
                'issues': [],
                'strengths': [],
                'general_feedback': ai_response,
                'code_quality_score': 50
            }
    
    def _map_decision(self, decision):
        """Map AI decision to model choice."""
        decision_map = {
            'APPROVE': 'approve',
            'REQUEST_CHANGES': 'request_changes',
            'COMMENT': 'comment',
        }
        return decision_map.get(decision, 'comment')
    
    def _post_review_to_github(self, github_client, repo_full_name, pr_number, commit_sha, review_data, code_review):
        """Post review to GitHub PR."""
        try:
            # Build review body
            body = self._format_review_body(review_data)
            
            # Map decision to GitHub event
            event_map = {
                'APPROVE': 'APPROVE',
                'REQUEST_CHANGES': 'REQUEST_CHANGES',
                'COMMENT': 'COMMENT',
            }
            event = event_map.get(review_data.get('decision'), 'COMMENT')
            
            # Post review
            try:
                github_review = github_client.create_review(
                    repo_full_name=repo_full_name,
                    pr_number=pr_number,
                    commit_id=commit_sha,
                    body=body,
                    event=event
                )
                
                # Update code review record
                code_review.posted_to_github = True
                code_review.github_review_id = github_review['id']
                code_review.save()
                logger.info(f"Posted formal review to GitHub PR #{pr_number}")
                
            except Exception as review_err:
                # Check if it's a self-review error (common 422 on GH)
                if '422' in str(review_err) or 'Reviewers cannot review their own pull request' in str(review_err):
                    logger.warning(f"Self-review detected for PR #{pr_number}. Falling back to Issue Comment.")
                    
                    # Fallback: Post as a comment instead of a formal review
                    github_client.create_issue_comment(
                        repo_full_name=repo_full_name,
                        issue_number=pr_number,
                        body=body
                    )
                    
                    code_review.posted_to_github = True
                    code_review.save()
                    logger.info(f"Posted review as comment to GitHub PR #{pr_number}")
                else:
                    # Reraise other errors to be caught by the outer try/except
                    raise review_err
                    
        except Exception as e:
            logger.error(f"Failed to post review to GitHub: {str(e)}")
    
    def _format_review_body(self, review_data):
        """Format review data into a professional Markdown report for GitHub."""
        # Top-level Metadata
        decision = review_data.get('decision', 'COMMENT')
        score = review_data.get('code_quality_score', 'N/A')
        
        decision_emoji = {
            'APPROVE': '✅',
            'REQUEST_CHANGES': '⚠️',
            'COMMENT': '💡'
        }.get(decision, '🔍')
        
        body = f"# 🌐 AI Mentor: Code Intelligence Report\n\n"
        body += f"| **Decision** | **Status** | **Quality Score** |\n"
        body += f"| :--- | :--- | :--- |\n"
        body += f"| {decision_emoji} **{decision}** | {'Audit Complete' if decision != 'COMMENT' else 'Analysis Pending'} | **{score}/100** |\n\n"
        
        # Summary Section
        body += f"### 📝 Executive Summary\n"
        body += f"{review_data.get('summary', 'No summary provided by the mentor.')}\n\n"
        
        # Strengths Section (if available)
        strengths = review_data.get('strengths', [])
        if strengths:
            body += "### ✨ Key Strengths\n"
            for strength in strengths:
                body += f"- {strength}\n"
            body += "\n"
        
        # Issues Section
        issues = review_data.get('issues', [])
        if issues:
            body += "### 🛠️ Required Improvements\n"
            body += "The following items must be addressed before this task can be considered complete:\n\n"
            
            for index, issue in enumerate(issues, 1):
                severity_emoji = {
                    'critical': '🔴',
                    'high': '🟠',
                    'medium': '🟡',
                    'low': '🟢'
                }.get(issue.get('severity'), '⚪')
                
                body += f"#### {index}. {severity_emoji} {issue.get('file', 'General')}\n"
                body += f"- **Issue Type:** `{issue.get('type', 'logic').upper()}`\n"
                if issue.get('line'):
                    body += f"- **Line:** {issue.get('line')}\n"
                body += f"- **Observation:** {issue.get('message')}\n"
                body += f"- **Mentor Recommendation:** {issue.get('suggestion')}\n\n"
        
        # General Feedback
        feedback = review_data.get('general_feedback')
        if feedback:
            # If the feedback looks like raw JSON (parsing failure), wrap it in a code block
            if feedback.strip().startswith('{') and '"summary"' in feedback:
                body += "### 🤖 Raw Technical Analysis\n"
                body += "The mentor generated a technical report that could not be fully formatted. You can read the JSON data below:\n\n"
                body += f"```json\n{feedback}\n```\n"
            else:
                body += "### 💡 Mentor Notes & Guidance\n"
                body += f"{feedback}\n"
        
        body += "\n---\n*This report was generated by the AI Senior Mentor logic in your AI Teacher platform.*"
        
        return body
