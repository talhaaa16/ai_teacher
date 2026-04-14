'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import { reviewsAPI } from '@/lib/api';
import { CodeReview } from '@/lib/types';
import {
    ShieldCheck,
    Activity,
    FileCode,
    Terminal,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Github,
    ChevronRight,
    Search,
    Bug,
    Cpu
} from 'lucide-react';

export default function ReviewsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();
    const [reviews, setReviews] = useState<CodeReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadReviews();
        }
    }, [isAuthenticated]);

    const loadReviews = async () => {
        try {
            const response = await reviewsAPI.list();
            const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setReviews(data);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const getDecisionStyles = (decision: string) => {
        const styles: Record<string, string> = {
            approve: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            request_changes: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            comment: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        };
        return styles[decision] || 'text-slate-400 bg-slate-800 border-slate-700';
    };

    const getSeverityStyles = (severity: string) => {
        const styles: Record<string, string> = {
            critical: 'text-red-500 bg-red-500/5',
            high: 'text-orange-500 bg-orange-500/5',
            medium: 'text-amber-500 bg-amber-500/5',
            low: 'text-sky-500 bg-sky-500/5',
        };
        return styles[severity] || 'text-slate-500';
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
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 uppercase tracking-[0.1em]">Quality Audits</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">AI-Driven Structural Analysis & Peer Review Feedback</p>
                </div>

                {/* Search / Filter bar placeholder */}
                <div className="flex mb-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-sky-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search audit history..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-700"
                        />
                    </div>
                </div>

                {/* Reviews List */}
                {reviews.length === 0 ? (
                    <div className="py-24 text-center card-gradient rounded-[3rem] border-dashed border-slate-800">
                        <div className="h-20 w-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="h-10 w-10 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">No Active Audits</h3>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Deploy code via Pull Request to initiate automated inspection sequence.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {reviews.map((review, idx) => (
                            <div
                                key={review.id}
                                className="group card-gradient rounded-[2.5rem] p-8 hover:border-sky-500/50 transition-all animate-slide-up shadow-2xl"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* card Top Bar */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-8">
                                    <div className="flex items-center space-x-6">
                                        <div className="h-16 w-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-sky-400 group-hover:border-sky-500/50 transition-colors">
                                            <Terminal className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Audit PR#{review.pr_number}</h3>
                                                <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getDecisionStyles(review.review_decision)}`}>
                                                    {review.review_decision.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commit: {review.commit_sha.substring(0, 7)}</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                                                <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">{review.files_changed.length} Files Inspected</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex items-center space-x-6 min-w-48 group-hover:bg-sky-500/5 transition-colors">
                                        <div className="border-r border-slate-800 pr-6">
                                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Score</div>
                                            <div className={`text-3xl font-black ${review.code_quality_score >= 80 ? 'text-emerald-400' : review.code_quality_score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {review.code_quality_score}%
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <TrendingUp className={`h-6 w-6 ${review.code_quality_score >= 80 ? 'text-emerald-500' : 'text-sky-500'}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Main content grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* AI Insights */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-2 px-2">
                                            <Cpu className="h-4 w-4 text-sky-400" />
                                            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Mentor Intelligence Report</h4>
                                        </div>
                                        <div className="bg-slate-950/50 border border-slate-800/50 rounded-3xl p-6 italic text-slate-400 leading-relaxed text-sm font-medium">
                                            "{review.ai_feedback}"
                                        </div>

                                        {review.strengths_identified && review.strengths_identified.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-2">Positive Compliance Patterns</div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {review.strengths_identified.map((strength, i) => (
                                                        <div key={i} className="flex items-center space-x-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-xs text-emerald-100/70">
                                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                            <span>{strength}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Issues & Files */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-2 px-2">
                                            <Bug className="h-4 w-4 text-red-400" />
                                            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Structural Vulns Detected</h4>
                                        </div>

                                        <div className="space-y-3">
                                            {review.issues_found && review.issues_found.length > 0 ? (
                                                review.issues_found.map((issue, i) => (
                                                    <div key={i} className={`border border-slate-800/50 rounded-2xl p-5 hover:border-slate-700 transition-all ${getSeverityStyles(issue.severity)}`}>
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{issue.severity}</span>
                                                                <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{issue.type}</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono text-slate-500">{issue.file}:{issue.line}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-200 font-bold mb-3 leading-tight">{issue.message}</p>
                                                        {issue.suggestion && (
                                                            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 text-xs text-sky-300 font-medium italic">
                                                                💡 TIP: {issue.suggestion}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 opacity-30 text-xs italic font-bold uppercase tracking-widest">No major anomalies found</div>
                                            )}
                                        </div>

                                        <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Log Generated: {new Date(review.created_at).toLocaleDateString()}</p>
                                            <button className="text-xs font-bold text-sky-400 hover:text-white transition-colors flex items-center space-x-2">
                                                <span>View Full Log</span>
                                                <ChevronRight className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
