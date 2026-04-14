'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import { projectsAPI, tasksAPI } from '@/lib/api';
import { Project, Task } from '@/lib/types';
import Link from 'next/link';
import {
    ChevronLeft,
    Github,
    ExternalLink,
    CheckCircle2,
    Clock,
    AlertCircle,
    Code2,
    Zap,
    Target,
    ArrowUpRight,
    CircleDashed,
    Send,
    PlusCircle,
    X,
    MessageSquare
} from 'lucide-react';

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { isAuthenticated, isLoading } = useAuthStore();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<Task | null>(null);
    const [prUrl, setPrUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [auditLoading, setAuditLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated && params.id) {
            loadProjectData();
        }
    }, [isAuthenticated, params.id]);

    const loadProjectData = async () => {
        try {
            const [projectRes, tasksRes] = await Promise.all([
                projectsAPI.get(params.id as string),
                tasksAPI.list({ project: params.id }),
            ]);

            setProject(projectRes.data);
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data?.results || []);
            setTasks(tasksData);
        } catch (error) {
            console.error('Failed to load project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSubmitModal = (task: Task) => {
        setSelectedTaskForSubmit(task);
        setPrUrl(task.github_pr_url || ''); // Pre-fill if editing
        setIsSubmitModalOpen(true);
    };

    const handleSubmitPr = async () => {
        if (!selectedTaskForSubmit || !prUrl) return;
        
        // Basic PR URL extraction
        const prNumberMatch = prUrl.match(/\/pull\/(\d+)/);
        if (!prNumberMatch) {
            alert('Invalid GitHub PR URL. Please provide a full link (e.g., https://github.com/user/repo/pull/1)');
            return;
        }
        
        setSubmitting(true);
        try {
            await tasksAPI.submit(selectedTaskForSubmit.id.toString(), {
                github_pr_url: prUrl,
                github_pr_number: parseInt(prNumberMatch[1]),
            });
            setIsSubmitModalOpen(false);
            setPrUrl('');
            loadProjectData();
        } catch (error) {
            console.error('Failed to submit PR:', error);
            alert('Failed to submit PR. Please check the URL and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestAudit = async (taskId: string) => {
        setAuditLoading(taskId);
        try {
            await tasksAPI.review(taskId);
            // Show some success feedback? For now just reload
            setTimeout(() => {
                loadProjectData();
                setAuditLoading(null);
            }, 1500);
        } catch (error) {
            console.error('Failed to request audit:', error);
            setAuditLoading(null);
            alert('Failed to request audit. Please try again.');
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <div className="h-20 w-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-slate-700" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Project Missing</h2>
                    <p className="text-slate-500 mb-8">This roadmap either doesn't exist or was archived by the mentor.</p>
                    <Link href="/projects" className="btn-primary inline-flex items-center space-x-2">
                        <ChevronLeft className="h-4 w-4" />
                        <span>Return to Projects</span>
                    </Link>
                </div>
            </div>
        );
    }

    const completionPercentage = project.task_count > 0
        ? Math.round((project.completed_tasks / project.task_count) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                {/* Header Navigation */}
                <div className="mb-8 overflow-hidden">
                    <Link href="/projects" className="text-sm font-bold text-slate-500 hover:text-sky-400 transition-colors flex items-center mb-4 uppercase tracking-[0.2em] group">
                        <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Roadmap Gallery
                    </Link>
                </div>

                {/* Hero Section */}
                <div className="relative mb-8 p-10 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border border-slate-800 shadow-3xl">
                    <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
                        <Code2 className="absolute top-10 right-10 w-64 h-64 text-sky-500 transform rotate-12" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="max-w-3xl">
                            <div className="flex items-center space-x-3 mb-4">
                                <span className={`px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full border ${project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        project.status === 'in_progress' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                            'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                    {project.status.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{project.difficulty_level} LEVEL</span>
                            </div>
                            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">{project.title}</h1>
                            <p className="text-lg text-slate-400 leading-relaxed mb-6 italic">"{project.description}"</p>

                            <div className="flex flex-wrap gap-2 mb-8">
                                {project.tech_stack?.map((tech, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-900/50 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-tight">
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {project.github_repo_url && (
                                    <a
                                        href={project.github_repo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary flex items-center space-x-2 bg-white text-slate-950 hover:bg-slate-200"
                                    >
                                        <Github className="h-5 w-5" />
                                        <span>Infrastructure Repo</span>
                                    </a>
                                )}
                                <Link
                                    href="/chat"
                                    className="px-6 py-3 rounded-2xl border border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 text-white font-bold transition-all flex items-center space-x-2"
                                >
                                    <Zap className="h-5 w-5 text-sky-400" />
                                    <span>Debug with Mentor</span>
                                </Link>
                            </div>
                        </div>

                        <div className="w-full lg:w-80 space-y-6">
                            <div className="card-gradient rounded-3xl p-8 text-center flex flex-col items-center">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Mastery Score</div>
                                <div className="relative h-24 w-24">
                                    <svg className="h-full w-full transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-slate-800"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 * (1 - completionPercentage / 100)}
                                            strokeLinecap="round"
                                            fill="transparent"
                                            className="text-sky-500 transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-black text-white">{completionPercentage}%</span>
                                    </div>
                                </div>
                                <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {project.completed_tasks} / {project.task_count} MILESTONES
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Flow Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center space-x-3 px-2">
                            <Target className="h-6 w-6 text-sky-400" />
                            <h2 className="text-2xl font-bold text-white tracking-tight uppercase tracking-[0.1em]">Execution Roadmap</h2>
                        </div>

                        <div className="space-y-4">
                            {tasks.length === 0 ? (
                                <div className="card-gradient rounded-3xl p-16 text-center border-dashed border-slate-800">
                                    <CircleDashed className="h-12 w-12 text-slate-700 mx-auto mb-4 animate-spin-slow" />
                                    <p className="text-slate-500">Mentor is preparing the architectural layers...</p>
                                </div>
                            ) : (
                                <div className="space-y-4 relative before:absolute before:left-7 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800 before:pointer-events-none">
                                    {tasks.map((task, idx) => (
                                        <div
                                            key={task.id}
                                            className={`relative pl-16 group animate-slide-up`}
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <div className={`absolute left-5 top-5 h-4 w-4 rounded-full z-10 border-4 border-slate-950 ${['approved', 'merged'].includes(task.status) ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                                    ['submitted', 'under_review'].includes(task.status) ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                                        'bg-sky-500/50'
                                                }`}></div>

                                            <div className="card-gradient rounded-[2rem] p-7 transition-all hover:border-sky-500/50 group-hover:translate-x-2">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight">{task.title}</h3>
                                                        <div className="flex items-center space-x-3 mt-1">
                                                            <span className={`text-[10px] font-bold uppercase ${['approved', 'merged'].includes(task.status) ? 'text-emerald-500' :
                                                                    ['submitted', 'under_review'].includes(task.status) ? 'text-amber-500' :
                                                                        'text-slate-500'
                                                                }`}>
                                                                {task.status.replace('_', ' ')}
                                                            </span>
                                                            <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                                                            <span className="text-[10px] text-slate-600 font-bold">TASK #{idx + 1}</span>
                                                        </div>
                                                    </div>
                                                    {task.github_pr_url ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            <a
                                                                href={task.github_pr_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center space-x-2 text-[10px] font-bold text-sky-400 hover:text-sky-300 uppercase tracking-widest bg-sky-500/10 px-4 py-2 rounded-xl transition-all"
                                                            >
                                                                <span>Review Submission</span>
                                                                <ArrowUpRight className="h-3 w-3" />
                                                            </a>
                                                            
                                                            {['submitted', 'under_review', 'revision_required', 'approved'].includes(task.status) && (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleRequestAudit(task.id.toString())}
                                                                        disabled={auditLoading === task.id.toString()}
                                                                        className="flex items-center space-x-2 text-[10px] font-bold text-white hover:text-sky-400 uppercase tracking-widest bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all disabled:opacity-50"
                                                                    >
                                                                        {auditLoading === task.id.toString() ? (
                                                                            <CircleDashed className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <Zap className="h-3 w-3 text-sky-400" />
                                                                        )}
                                                                        <span>{task.status === 'revision_required' ? 'Request Re-Audit' : 'Trigger Audit'}</span>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleOpenSubmitModal(task)}
                                                                        className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 transition-all"
                                                                        title="Change PR Link"
                                                                    >
                                                                        <span>Update Link</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        (task.status === 'assigned' || task.status === 'in_progress') && (
                                                            <button
                                                                onClick={() => handleOpenSubmitModal(task)}
                                                                className="flex items-center space-x-2 text-[10px] font-bold text-white hover:text-sky-400 uppercase tracking-widest bg-sky-500/20 hover:bg-sky-500/30 px-4 py-2 rounded-xl border border-sky-500/30 transition-all"
                                                            >
                                                                <PlusCircle className="h-4 w-4" />
                                                                <span>Submit Milestone</span>
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                                <p className="text-slate-400 leading-relaxed max-w-2xl">{task.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card-gradient rounded-3xl p-8 sticky top-28 border-sky-500/10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-bold text-white italic">Architecture Review</h3>
                                <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-sky-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase">System Design phase</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Verify your initial architecture follows the DDD patterns we discussed.</p>
                                </div>

                                <div className="h-px bg-slate-800 w-full"></div>

                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mentor Feed</div>
                                    {[
                                        "Focus on decoupled service layers.",
                                        "Ensure GitHub Action workflows are optimized.",
                                        "The Gemini logic needs error boundaries."
                                    ].map((note, i) => (
                                        <div key={i} className="flex items-start space-x-3 text-sm text-slate-400 italic">
                                            <span>→</span>
                                            <span>{note}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href="/chat"
                                    className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold text-white hover:border-sky-500/50 transition-all uppercase tracking-widest"
                                >
                                    <span>Open Live Terminal</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Submission Modal */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-lg w-full shadow-3xl animate-scale-up">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Submit Milestone</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">Link your Pull Request for AI Senior Review</p>
                            </div>
                            <button onClick={() => setIsSubmitModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Selected Task</div>
                                <div className="text-white font-bold">{selectedTaskForSubmit?.title}</div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">GitHub Pull Request URL</label>
                                <input
                                    type="text"
                                    value={prUrl}
                                    onChange={(e) => setPrUrl(e.target.value)}
                                    placeholder="https://github.com/user/repo/pull/1"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white text-sm focus:border-sky-500 outline-none transition-all placeholder:text-slate-700"
                                />
                                <p className="text-[10px] text-slate-600 font-bold mt-3 px-1 uppercase tracking-tighter italic">
                                    → Once linked, your AI Mentor will audit the code and auto-merge if approved.
                                </p>
                            </div>

                            <button
                                onClick={handleSubmitPr}
                                disabled={submitting || !prUrl}
                                className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-30 uppercase tracking-[0.2em] flex items-center justify-center space-x-2"
                            >
                                {submitting ? (
                                    <CircleDashed className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Initialize Audit Phase</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
