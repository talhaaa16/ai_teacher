'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
    LayoutDashboard,
    Folder,
    CheckCircle2,
    ShieldCheck,
    MessageSquare,
    LogOut,
    Menu,
    X,
    Cpu,
    ChevronDown,
    User
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: Folder },
        { name: 'Tasks', href: '/tasks', icon: CheckCircle2 },
        { name: 'Reviews', href: '/reviews', icon: ShieldCheck },
        { name: 'AI Chat', href: '/chat', icon: MessageSquare },
    ];

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <nav className="sticky top-0 z-50 px-4 py-4 pointer-events-none">
            <div className="max-w-7xl mx-auto pointer-events-auto">
                <div className="glass rounded-2xl border-slate-800/50 shadow-2xl px-6">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Logo */}
                            <Link href="/dashboard" className="flex items-center space-x-3 group">
                                <div className="h-10 w-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center group-hover:border-sky-500/50 transition-all shadow-inner">
                                    <Cpu className="h-5 w-5 text-sky-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white uppercase tracking-widest leading-none">AI Teacher</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Senior Mentor v2.5</span>
                                </div>
                            </Link>

                            {/* Navigation Links */}
                            <div className="hidden lg:ml-10 lg:flex lg:space-x-1">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${isActive
                                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <Icon className={`mr-2.5 h-3.5 w-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            {user && (
                                <>
                                    <div className="hidden md:flex items-center space-x-3 pl-4 pr-1 py-1 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-white uppercase tracking-tight">
                                                {user.github_username}
                                            </span>
                                            <span className="text-[8px] font-bold text-sky-500 uppercase tracking-widest">
                                                Active Intern
                                            </span>
                                        </div>
                                        {user.avatar_url && (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.github_username}
                                                className="h-8 w-8 rounded-xl border border-slate-800 hover:border-sky-500 transition-colors"
                                            />
                                        )}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95"
                                        title="System Shutdown"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </>
                            )}

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                            >
                                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden mt-2 glass rounded-2xl border-slate-800 p-2 animate-fade-in shadow-2xl">
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <Icon className="mr-3 h-4 w-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
