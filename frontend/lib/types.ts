/**
 * Type definitions for AI Teacher
 */

export interface User {
    id: number;
    github_id: string;
    github_username: string;
    email: string;
    avatar_url: string;
    skill_level: string;
    strengths: string[];
    weaknesses: string[];
}

export interface Project {
    id: number;
    title: string;
    description: string;
    github_repo_url: string;
    github_repo_full_name: string;
    tech_stack: string[];
    architecture_guidelines: string;
    coding_standards: string;
    status: 'assigned' | 'in_progress' | 'completed' | 'archived';
    difficulty_level: string;
    estimated_duration_hours: number;
    assigned_at: string;
    completed_at: string | null;
    task_count: number;
    completed_tasks: number;
}

export interface Task {
    id: number;
    project: number;
    project_title: string;
    title: string;
    description: string;
    acceptance_criteria: string[];
    order: number;
    github_branch: string;
    github_pr_number: number | null;
    github_pr_url: string;
    status: 'assigned' | 'in_progress' | 'submitted' | 'under_review' | 'revision_required' | 'approved' | 'merged';
    focus_areas: string[];
    hints: string[];
    assigned_at: string;
    submitted_at: string | null;
    approved_at: string | null;
    latest_review: CodeReview | null;
}

export interface CodeReview {
    id: number;
    task: number;
    pr_number: number;
    commit_sha: string;
    files_changed: string[];
    ai_feedback: string;
    review_decision: 'approve' | 'request_changes' | 'comment';
    issues_found: Issue[];
    strengths_identified: string[];
    suggestions: any[];
    code_quality_score: number;
    posted_to_github: boolean;
    created_at: string;
}

export interface Issue {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    file: string;
    line: number;
    message: string;
    suggestion: string;
}

export interface Conversation {
    id: number;
    project: number | null;
    project_title: string | null;
    task: number | null;
    task_title: string | null;
    messages: Message[];
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    code_context: any;
    created_at: string;
}
