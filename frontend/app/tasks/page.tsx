'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import { tasksAPI } from '@/lib/api';
import { Task } from '@/lib/types';
import {
    CheckSquare,
    Filter,
    Calendar,
    GitBranch,
    MessageCircle,
    FileText,
    Award,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Search
} from 'lucide-react';

export default function TasksPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadTasks();
        }
    }, [isAuthenticated]);

    const loadTasks = async () => {
        try {
            const response = await tasksAPI.list();
            const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['assigned', 'in_progress', 'submitted', 'under_review'].includes(task.status);
        if (filter === 'completed') return ['approved', 'merged'].includes(task.status);
        return task.status === filter;
    });

    const getStatusStyles = (status: string) => {
        const styles: Record<string, { color: string, icon: any }> = {
            assigned: { color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', icon: Clock },
            in_progress: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
            submitted: { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: FileText },
            under_review: { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: MessageCircle },
            revision_required: { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: AlertCircle },
            approved: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
            merged: { color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: GitBranch },
        };
        return styles[status] || { color: 'text-slate-400 bg-slate-800 border-slate-700', icon: AlertCircle };
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 uppercase tracking-[0.1em]">Deployment Log</h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Operational Readiness & Milestone Tracking</p>
                    </div>
                </div>

                {/* Filters Hub */}
                <div className="card-gradient rounded-3xl p-6 mb-8 border-slate-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center space-x-3">
                            <Filter className="h-4 w-4 text-sky-400" />
                            <div className="flex flex-wrap gap-2">
                                {['all', 'active', 'assigned', 'in_progress', 'submitted', 'under_review', 'completed'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f
                                                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                                                : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        {f.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                            <input
                                type="text"
                                placeholder="Search log..."
                                className="bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-sky-500 outline-none transition-all w-full lg:w-64 placeholder:text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                {filteredTasks.length === 0 ? (
                    <div className="py-24 text-center card-gradient rounded-[3rem] border-dashed border-slate-800">
                        <div className="h-20 w-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <CheckSquare className="h-10 w-10 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">System Idle</h3>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
                            {filter === 'all' ? 'Synchronizing with mentor for task assignment...' : `No tasks matching '${filter}' criteria.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTasks.map((task, idx) => {
                            const styles = getStatusStyles(task.status);
                            const StatusIcon = styles.icon;

                            return (
                                <div
                                    key={task.id}
                                    className="group card-gradient rounded-[2rem] p-8 hover:border-sky-500/50 transition-all flex flex-col lg:flex-row lg:items-center gap-8 animate-slide-up"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles.color} flex items-center space-x-1.5`}>
                                                <StatusIcon className="h-3 w-3" />
                                                <span>{task.status.replace('_', ' ')}</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{task.project_title}</span>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight mb-2">{task.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-3xl italic">"{task.description}"</p>

                                        <div className="flex flex-wrap gap-6 items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <div className="flex items-center space-x-2">
                                                <GitBranch className="h-3.5 w-3.5 text-sky-500" />
                                                <span className="text-slate-300">{task.github_branch}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-3.5 w-3.5 text-slate-700" />
                                                <span>DEPLOYED {new Date(task.assigned_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full lg:w-72 space-y-4">
                                        {task.latest_review && (
                                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden group/review hover:border-sky-500/30 transition-all">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/review:opacity-30 transition-opacity">
                                                    <Award className="h-10 w-10 text-sky-500" />
                                                </div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Review Score</span>
                                                    <span className="text-xs font-bold text-sky-400">{task.latest_review.code_quality_score}%</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed">
                                                    {task.latest_review.ai_feedback}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            {task.github_pr_url && (
                                                <a
                                                    href={task.github_pr_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-3 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-center flex items-center justify-center space-x-2"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    <span>Review Channel</span>
                                                </a>
                                            )}
                                            <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:text-sky-400 hover:border-sky-500/50 transition-all">
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
