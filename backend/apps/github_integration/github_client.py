"""
GitHub API client for interacting with repositories and pull requests.
"""
import requests
from typing import Dict, List, Optional
from django.conf import settings


class GitHubAPIClient:
    """
    Client for GitHub REST API operations.
    """
    
    BASE_URL = 'https://api.github.com'
    
    def __init__(self, access_token: str):
        """
        Initialize GitHub API client.
        
        Args:
            access_token: GitHub personal access token
        """
        self.access_token = access_token
        self.headers = {
            'Authorization': f'token {access_token}',
            'Accept': 'application/vnd.github.v3+json',
        }
    
    def get_repository(self, repo_full_name: str) -> Dict:
        """
        Get repository details.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            
        Returns:
            Repository data
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_pull_request(self, repo_full_name: str, pr_number: int) -> Dict:
        """
        Get pull request details.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            pr_number: Pull request number
            
        Returns:
            Pull request data
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}/pulls/{pr_number}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_pull_request_diff(self, repo_full_name: str, pr_number: int) -> str:
        """
        Get pull request diff content.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            pr_number: Pull request number
            
        Returns:
            Diff content as string
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}/pulls/{pr_number}"
        headers = {
            **self.headers,
            'Accept': 'application/vnd.github.v3.diff'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.text
    
    def get_pull_request_files(self, repo_full_name: str, pr_number: int) -> List[Dict]:
        """
        Get list of files changed in pull request.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            pr_number: Pull request number
            
        Returns:
            List of file data
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}/pulls/{pr_number}/files"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_file_content(self, repo_full_name: str, file_path: str, ref: str = 'main') -> str:
        """
        Get content of a specific file.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            file_path: Path to file in repository
            ref: Branch, tag, or commit SHA
            
        Returns:
            File content as string
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}/contents/{file_path}"
        params = {'ref': ref}
        headers = {
            **self.headers,
            'Accept': 'application/vnd.github.v3.raw'
        }
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.text
    
    def create_review_comment(
        self,
        repo_full_name: str,
        pr_number: int,
        body: str,
        commit_id: str,
        path: Optional[str] = None,
        line: Optional[int] = None
    ) -> Dict:
        """
        Create a review comment on a pull request.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            pr_number: Pull request number
            body: Comment body
            commit_id: SHA of the commit to comment on
            path: File path (for inline comments)
            line: Line number (for inline comments)
            
        Returns:
            Created comment data
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}/pulls/{pr_number}/comments"
        data = {
            'body': body,
            'commit_id': commit_id,
        }
        if path and line:
            data['path'] = path
            data['line'] = line
        
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()
    
    def create_review(
        self,
        repo_full_name: str,
        pr_number: int,
        commit_id: str,
        body: str,
        event: str = 'COMMENT',
        comments: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Create a review on a pull request.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            pr_number: Pull request number
            commit_id: SHA of the commit to review
            body: Review body
            event: Review event type (APPROVE, REQUEST_CHANGES, COMMENT)
            comments: List of inline comments
            
        Returns:
            Created review data
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}/pulls/{pr_number}/reviews"
        data = {
            'commit_id': commit_id,
            'body': body,
            'event': event,
        }
        if comments:
            data['comments'] = comments
        
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()
    
    def merge_pull_request(
        self,
        repo_full_name: str,
        pr_number: int,
        commit_title: Optional[str] = None,
        commit_message: Optional[str] = None,
        merge_method: str = 'merge'
    ) -> Dict:
        """
        Merge a pull request.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            pr_number: Pull request number
            commit_title: Title for merge commit
            commit_message: Message for merge commit
            merge_method: Merge method (merge, squash, rebase)
            
        Returns:
            Merge result data
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}/pulls/{pr_number}/merge"
        data = {'merge_method': merge_method}
        if commit_title:
            data['commit_title'] = commit_title
        if commit_message:
            data['commit_message'] = commit_message
        
        response = requests.put(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()
    def create_issue_comment(self, repo_full_name: str, issue_number: int, body: str) -> Dict:
        """
        Create a comment on an issue or pull request.
        
        Args:
            repo_full_name: Repository in format 'owner/repo'
            issue_number: Issue or pull request number
            body: Comment body
            
        Returns:
            Created comment data
        """
        url = f"{self.BASE_URL}/repos/{repo_full_name}/issues/{issue_number}/comments"
        data = {'body': body}
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()
