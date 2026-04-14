'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import { conversationsAPI } from '@/lib/api';
import { Conversation, Message } from '@/lib/types';
import {
    Send,
    Plus,
    MessageSquare,
    Terminal,
    Cpu,
    Search,
    Hash,
    MoreVertical,
    Command,
    Sparkles,
    User
} from 'lucide-react';

export default function ChatPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadConversations();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedConversation?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            const response = await conversationsAPI.list();
            const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setConversations(data);
            if (data.length > 0) {
                setSelectedConversation(data[0]);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const createNewConversation = async () => {
        try {
            const response = await conversationsAPI.create({
                project: null,
                task: null,
            });
            const newConv = response.data;
            setConversations([newConv, ...conversations]);
            setSelectedConversation(newConv);
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const sendMessage = async () => {
        if (!message.trim() || !selectedConversation || sending) return;

        const userMessage = message;
        setMessage('');
        setSending(true);

        // Optimistic Update
        const optimisticMessage: Message = {
            id: Date.now(), // Temporary ID
            role: 'user',
            content: userMessage,
            code_context: null,
            created_at: new Date().toISOString()
        };

        const updatedMessages = [...selectedConversation.messages, optimisticMessage];
        const updatedSelectedConv = { ...selectedConversation, messages: updatedMessages };

        setSelectedConversation(updatedSelectedConv);
        setConversations(conversations.map(c =>
            c.id === selectedConversation.id ? updatedSelectedConv : c
        ));

        try {
            const response = await conversationsAPI.sendMessage(selectedConversation.id.toString(), userMessage);
            const finalConv = response.data;

            // Update with real data from server
            setSelectedConversation(finalConv);
            setConversations(prev => prev.map(c =>
                c.id === finalConv.id ? finalConv : c
            ));
        } catch (error) {
            console.error('Failed to send message:', error);
            // Revert message to input on failure
            setMessage(userMessage);
            // Optionally remove the optimistic message or show error
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
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
        <div className="h-screen bg-slate-950 flex flex-col text-slate-200">
            <Navbar />

            <main className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-3xl flex h-full overflow-hidden animate-fade-in">

                    {/* Sidebar */}
                    <div className="w-80 border-r border-slate-800 hidden md:flex flex-col">
                        <div className="p-6 border-b border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Channels</h2>
                                <button
                                    onClick={createNewConversation}
                                    className="p-1.5 hover:bg-sky-500 hover:text-slate-950 rounded-lg transition-all text-sky-400"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                                <input
                                    type="text"
                                    placeholder="Filter comms..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {conversations.length === 0 ? (
                                <div className="text-center py-10 opacity-30 italic text-sm">Offline</div>
                            ) : (
                                conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`w-full p-4 text-left rounded-2xl transition-all border flex items-center space-x-3 group ${selectedConversation?.id === conv.id
                                            ? 'bg-sky-500/10 border-sky-500/30 text-white'
                                            : 'border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                                            }`}
                                    >
                                        <Hash className={`h-4 w-4 ${selectedConversation?.id === conv.id ? 'text-sky-400' : 'text-slate-600'}`} />
                                        <div className="truncate text-xs font-bold uppercase tracking-tight">
                                            {conv.project_title || conv.task_title || 'General Sync'}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mentor Connected</span>
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-slate-950/20 backdrop-blur-3xl">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400">
                                            <Cpu className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                                                {selectedConversation.project_title || selectedConversation.task_title || 'System Core Chat'}
                                            </h2>
                                            <div className="flex items-center space-x-2 mt-0.5">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">AI Mentor Instance</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                                                <span className="text-[10px] text-sky-500 font-bold uppercase tracking-tighter">Encrypted</span>
                                            </div>
                                        </div>
                                    </div>
                                    <MoreVertical className="h-4 w-4 text-slate-600 cursor-pointer" />
                                </div>

                                {/* Messages Viewport */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                                    {selectedConversation.messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-20">
                                            <Terminal className="h-12 w-12 mb-4" />
                                            <p className="text-xs uppercase font-bold tracking-[0.3em]">Initialize sequence...</p>
                                        </div>
                                    ) : (
                                        selectedConversation.messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                                            >
                                                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-xl group`}>
                                                    <div className="flex items-center space-x-2 mb-2 px-1">
                                                        {msg.role !== 'user' && <Sparkles className="h-3 w-3 text-sky-400" />}
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                                            {msg.role === 'user' ? user?.github_username : 'Senior Developer AI'}
                                                        </span>
                                                        {msg.role === 'user' && <User className="h-3 w-3 text-slate-600" />}
                                                    </div>

                                                    <div className={`relative p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-xl border ${msg.role === 'user'
                                                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-medium rounded-tr-none'
                                                        : 'card-gradient text-slate-300 border-slate-800 rounded-tl-none'
                                                        }`}>
                                                        {msg.content}
                                                    </div>

                                                    <span className="text-[9px] font-bold text-slate-600 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {sending && (
                                        <div className="flex justify-start animate-pulse">
                                            <div className="flex flex-col items-start max-w-xl group">
                                                <div className="flex items-center space-x-2 mb-2 px-1">
                                                    <Sparkles className="h-3 w-3 text-sky-400" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                                        Senior Developer AI is thinking...
                                                    </span>
                                                </div>
                                                <div className="relative p-5 rounded-[1.5rem] border bg-slate-900/50 border-slate-800 rounded-tl-none">
                                                    <div className="flex space-x-2">
                                                        <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                        <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                        <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Modern Terminal Input */}
                                <div className="p-6">
                                    <div className="max-w-4xl mx-auto w-full relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-slate-500">
                                            <Command className="h-4 w-4" />
                                            <span className="text-xs font-bold select-none italic">Intern:</span>
                                        </div>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Write to the mentor..."
                                            className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl py-5 pl-24 pr-16 text-sm text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-700 resize-none shadow-2xl"
                                            rows={1}
                                            disabled={sending}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!message.trim() || sending}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-sky-500 rounded-2xl flex items-center justify-center text-slate-950 hover:bg-sky-400 transition-all disabled:opacity-30 active:scale-95 shadow-lg shadow-sky-500/20"
                                        >
                                            {sending ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950/30 border-t-slate-950"></div>
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex justify-center mt-3">
                                        <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em] animate-pulse">
                                            Press Shift + Enter for new lines
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-40">
                                <div className="h-32 w-32 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center justify-center relative shadow-3xl">
                                    <MessageSquare className="h-16 w-16 text-slate-700" />
                                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-sky-500 rounded-full border-4 border-slate-950"></div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-extrabold text-white tracking-tight uppercase">Comms Offline</h3>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-widest">Select an active link to begin sync</p>
                                </div>
                                <button
                                    onClick={createNewConversation}
                                    className="px-8 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-sky-500/50 hover:text-white transition-all active:scale-95"
                                >
                                    Initialize Core Sync
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
