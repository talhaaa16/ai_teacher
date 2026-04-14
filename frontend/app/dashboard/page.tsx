'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import { projectsAPI, tasksAPI } from '@/lib/api';
import { Project, Task } from '@/lib/types';
import {
    Trophy,
    Target,
    CheckCircle2,
    Clock,
    TrendingUp,
    Folder,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardData();
        }
    }, [isAuthenticated]);

    const loadDashboardData = async () => {
        try {
            const [projectsRes, tasksRes] = await Promise.all([
                projectsAPI.list(),
                tasksAPI.list(),
            ]);

            // Ensure we have arrays, handle both paginated and non-paginated responses
            const projectsData = Array.isArray(projectsRes.data)
                ? projectsRes.data
                : (projectsRes.data?.results || []);

            const tasksData = Array.isArray(tasksRes.data)
                ? tasksRes.data
                : (tasksRes.data?.results || []);

            setProjects(projectsData);
            setTasks(tasksData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Set empty arrays on error
            setProjects([]);
            setTasks([]);
        } finally {
            setLoadingData(false);
        }
    };

    if (isLoading || loadingData) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
                </div>
            </div>
        );
    }

    const activeTasks = tasks.filter(t => ['assigned', 'in_progress', 'submitted', 'under_review'].includes(t.status));
    const completedTasksNum = tasks.filter(t => ['approved', 'merged'].includes(t.status)).length;
    const totalTasksNum = tasks.length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <Navbar />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                {/* Hero Header */}
                <div className="relative mb-10 p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-2xl">
                    <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                        <div className="absolute top-10 right-10 w-40 h-40 bg-sky-500 rounded-full blur-[80px]"></div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center space-x-2 text-sky-400 mb-2">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-[0.2em]">Current Progress</span>
                            </div>
                            <h2 className="text-4xl font-extrabold text-white tracking-tight">
                                Welcome back, <span className="text-sky-400">{user?.github_username}</span>
                            </h2>
                            <p className="mt-3 text-slate-400 max-w-lg">
                                You've completed {completedTasksNum} tasks this week. Keep up the high-velocity engineering—your mentor is impressed.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <div className="px-5 py-3 glass rounded-2xl flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">Skill Level</span>
                                <span className="text-white font-bold capitalize">{user?.skill_level || 'Pro'}</span>
                            </div>
                            <Link href="/projects" className="btn-primary flex items-center space-x-2">
                                <span>View Roadmap</span>
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Projects', value: projects.length, icon: Folder, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                        { label: 'Active Tasks', value: activeTasks.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Completed', value: completedTasksNum, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Next Goal', value: 'Level Up', icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="card-gradient rounded-2xl p-6 shadow-xl hover:translate-y-[-4px] transition-all cursor-default group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-3xl font-extrabold text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-[10px] text-slate-500 font-bold uppercase">
                                <span className={`${stat.color}`}>+12%</span>
                                <span className="ml-2">from last session</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Tasks - Left 2/3 */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center space-x-3">
                                <Target className="text-sky-400 h-5 w-5" />
                                <h3 className="text-xl font-bold text-white tracking-tight">Active Sprints</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="p-2 text-slate-500 hover:text-white transition-colors"><Filter className="h-4 w-4" /></button>
                                <button className="p-2 text-slate-500 hover:text-white transition-colors"><Search className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {activeTasks.length === 0 ? (
                            <div className="card-gradient rounded-3xl p-12 text-center border-dashed border-slate-700">
                                <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Clock className="h-8 w-8 text-slate-700" />
                                </div>
                                <h4 className="text-white font-bold mb-2">No Active Sprints</h4>
                                <p className="text-slate-500 max-w-sm mx-auto">Your AI mentor is waiting for you to pick a project or finish current reviews.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {activeTasks.map((task) => (
                                    <div key={task.id} className="card-gradient group rounded-2xl p-5 hover:border-sky-500/50 transition-all flex items-center justify-between">
                                        <div className="flex items-start space-x-4">
                                            <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${task.status === 'in_progress' ? 'bg-amber-500/20 text-amber-500' : 'bg-sky-500/20 text-sky-500'
                                                }`}>
                                                <Target className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="font-bold text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight">{task.title}</h4>
                                                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full font-bold">{task.project_title}</span>
                                                </div>
                                                <p className="text-sm text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                                                <div className="flex items-center mt-3 space-x-4 text-[10px] text-slate-500 font-bold uppercase">
                                                    <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> Today</span>
                                                    <span className="capitalize px-2 py-0.5 bg-slate-900 rounded border border-slate-800">{task.status.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/projects/${task.project}`} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:bg-sky-500 hover:text-slate-950 transition-all">
                                            <ChevronRight className="h-5 w-5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Projects & Social */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center justify-between px-2 mb-4">
                                <h3 className="text-lg font-bold text-white italic">Active Projects</h3>
                                <Link href="/projects" className="text-xs text-sky-400 hover:underline">See all</Link>
                            </div>

                            <div className="space-y-4">
                                {projects.slice(0, 3).map((project) => (
                                    <div key={project.id} className="card-gradient rounded-2xl p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-sky-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-slate-200">{project.title}</h4>
                                            <span className="text-[10px] text-slate-500 font-bold">{Math.round((project.completed_tasks / (project.task_count || 1)) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1">
                                            <div
                                                className="bg-sky-500 h-1 rounded-full px-1 py-1"
                                                style={{ width: `${(project.completed_tasks / (project.task_count || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex -space-x-1">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-5 w-5 rounded-full border border-slate-900 bg-slate-700"></div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{project.difficulty_level}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Reviews / Mentor Activity (Mock-like filler) */}
                        <div className="card-gradient rounded-3xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2 text-sky-400" />
                                Mentor Feed
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { msg: "Code review updated for Pull Request #12", time: "2m ago" },
                                    { msg: "New architectural task assigned", time: "1h ago" },
                                    { msg: "Task #2 moved to 'Under Review'", time: "4h ago" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start space-x-3">
                                        <div className="h-2 w-2 rounded-full bg-sky-500 mt-2 shrink-0"></div>
                                        <div>
                                            <p className="text-sm text-slate-300">{item.msg}</p>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{item.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
