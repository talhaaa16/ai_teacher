'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import { projectsAPI } from '@/lib/api';
import { Project } from '@/lib/types';
import Link from 'next/link';
import {
    Sparkles,
    Clock,
    Layers,
    ChevronRight,
    Search,
    BrainCircuit,
    BarChart3,
    X
} from 'lucide-react';

export default function ProjectsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadProjects();
        }
    }, [isAuthenticated]);

    const loadProjects = async () => {
        try {
            const response = await projectsAPI.list();
            const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [topic, setTopic] = useState('');
    const [skillLevel, setSkillLevel] = useState('beginner');

    const handleGenerateProject = async () => {
        setIsGenerating(true);
        try {
            await projectsAPI.generate({ topic, skill_level: skillLevel });
            setShowModal(false);
            setTopic('');
            loadProjects();
        } catch (error) {
            console.error('Failed to generate project:', error);
            alert('Failed to generate project. Please try again.');
        } finally {
            setIsGenerating(false);
        }
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Your <span className="text-sky-400">Roadmap</span></h1>
                        <p className="mt-2 text-slate-400">High-impact engineering projects assigned by your AI Senior Mentor.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center space-x-2 py-3 px-6 shadow-sky-500/20 shadow-2xl transition-all hover:scale-105 active:scale-95"
                    >
                        <Sparkles className="h-5 w-5" />
                        <span>Request New Project</span>
                    </button>
                </div>

                {/* Search Bar Placeholder for "Filled" feel */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search your projects..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['All', 'In Progress', 'Completed'].map(tab => (
                            <button key={tab} className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${tab === 'All' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
                                }`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <div className="text-center py-24 card-gradient rounded-3xl border-dashed border-slate-800">
                        <div className="mx-auto h-20 w-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-6">
                            <Layers className="h-10 w-10 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Projects Assigned</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Click the button above to let your AI mentor design a challenge specifically for you.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="card-gradient group rounded-2xl p-6 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/5 transition-all flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-10 w-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Layers className="h-5 w-5 text-sky-400" />
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        project.status === 'in_progress' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                            'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors mb-2">{project.title}</h3>
                                <p className="text-sm text-slate-400 mb-6 line-clamp-2 flex-grow">{project.description}</p>

                                {/* Tech Stack Cards */}
                                {project.tech_stack && project.tech_stack.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {project.tech_stack.map((tech, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-bold rounded uppercase tracking-tight">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Progress Footer */}
                                <div className="pt-6 border-t border-slate-800 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold uppercase">
                                            <BarChart3 className="h-3 w-3" />
                                            <span>Progress</span>
                                        </div>
                                        <span className="text-[10px] text-white font-bold">{project.completed_tasks}/{project.task_count} TASKS</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                                        <div
                                            className="bg-sky-500 h-1 rounded-full transition-all duration-700"
                                            style={{ width: `${project.task_count > 0 ? (project.completed_tasks / project.task_count) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase pt-1">
                                        <div className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {project.estimated_duration_hours}H EST.</div>
                                        <div className="flex items-center text-white">ENTER PROJECT <ChevronRight className="h-3 w-3 ml-1" /></div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Generation Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-3xl max-w-lg w-full p-8 relative animate-slide-up">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="text-center mb-10">
                                <div className="h-20 w-20 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <BrainCircuit className="text-sky-400 h-10 w-10" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Project Studio</h3>
                                <p className="text-slate-400">Collaborate with the AI Senior to design your next milestone.</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Experience Level</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['beginner', 'intermediate', 'advanced'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setSkillLevel(level)}
                                                className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${skillLevel === level
                                                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-lg shadow-sky-500/5'
                                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Project Focus (Optional)</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Distributed SQL Database, Neumorphic UI..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 px-5 text-sm text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-600"
                                    />
                                </div>

                                <button
                                    onClick={handleGenerateProject}
                                    disabled={isGenerating}
                                    className="w-full py-4 bg-sky-500 text-slate-950 font-bold rounded-2xl hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3 shadow-xl shadow-sky-500/20 active:scale-95 mt-4"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950/30 border-t-slate-950"></div>
                                            <span>Analyzing Industry Trends...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5" />
                                            <span>Initialize New Project</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
