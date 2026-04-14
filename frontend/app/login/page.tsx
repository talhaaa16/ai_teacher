'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import { Github, GraduationCap, Code, Rocket, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
    const [loginUrl, setLoginUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLoginUrl = async () => {
            try {
                const response = await authAPI.getGitHubLoginUrl();
                const url = response.data.url || response.data.authorization_url || response.data;

                if (typeof url === 'string' && url.startsWith('http')) {
                    setLoginUrl(url);
                } else {
                    throw new Error('Invalid URL in response');
                }
            } catch (error: any) {
                const clientId = 'Ov23liFYSEWlZRm0k8P9';
                const redirectUri = encodeURIComponent('http://localhost:8000/api/v1/auth/github/callback/');
                const fallbackUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email,read:user`;
                setLoginUrl(fallbackUrl);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLoginUrl();
    }, []);

    const handleGitHubLogin = () => {
        if (loginUrl) {
            window.location.href = loginUrl;
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 overflow-hidden">
            {/* Left Side: Brand & Features */}
            <div className="relative hidden lg:flex flex-col justify-center p-12 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center space-x-3 mb-12">
                        <div className="h-14 w-14 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                            <GraduationCap className="text-slate-950 h-8 w-8" />
                        </div>
                        <span className="text-3xl font-bold tracking-tight text-white">
                            AI <span className="text-sky-400">Mentor</span>
                        </span>
                    </div>

                    <h1 className="text-5xl font-extrabold text-white leading-tight mb-8">
                        Accelerate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Engineering</span> journey.
                    </h1>

                    <div className="space-y-8">
                        <div className="flex items-start space-x-5">
                            <div className="h-10 w-10 shrink-0 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center">
                                <Code className="h-5 w-5 text-sky-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Personalized Projects</h3>
                                <p className="text-slate-400">Real-world software paths designed specifically for your current skill level.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-5">
                            <div className="h-10 w-10 shrink-0 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center">
                                <Shield className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Automated Code Reviews</h3>
                                <p className="text-slate-400">Get senior-level feedback on every Pull Request instantly via Gemini 2.5.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-5">
                            <div className="h-10 w-10 shrink-0 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center">
                                <Zap className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Grounded Mentorship</h3>
                                <p className="text-slate-400">Chat with a mentor who actually studies your code and project architecture.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Card */}
            <div className="flex items-center justify-center p-6 bg-slate-950">
                <div className="max-w-md w-full animate-slide-up">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="h-14 w-14 bg-sky-500 rounded-2xl flex items-center justify-center">
                            <GraduationCap className="text-slate-950 h-8 w-8" />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl relative">
                        <div className="absolute -top-10 left-10 h-20 w-20 bg-sky-500/10 blur-3xl pointer-events-none"></div>

                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-slate-500">Sign in to continue your internship</p>
                        </div>

                        <button
                            onClick={handleGitHubLogin}
                            disabled={isLoading || !loginUrl}
                            className="group w-full flex items-center justify-center space-x-3 py-4 px-6 bg-white text-slate-950 font-bold rounded-2xl hover:bg-sky-400 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-white/5 active:scale-95"
                        >
                            <Github className="h-6 w-6" />
                            <span>{isLoading ? 'Connecting...' : 'Continue with GitHub'}</span>
                        </button>

                        <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-center space-x-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400`}>
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm text-slate-500">Joined by 1,000+ developers</span>
                        </div>
                    </div>

                    <p className="text-center mt-8 text-xs text-slate-600">
                        Secure connection powered by GitHub OAuth 2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
