/**
 * Authentication Store using Zustand
 */
'use client';

import { create } from 'zustand';
import { User } from '@/lib/types';
import { authAPI } from '@/lib/api';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
    isLoading: true, // Start as true to check for existing auth
    isAuthenticated: false,

    login: async (token: string) => {
        localStorage.setItem('auth_token', token);
        set({ token, isLoading: true });

        try {
            const response = await authAPI.getCurrentUser();
            set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('auth_token');
            set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    fetchUser: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

        if (!token) {
            set({ isAuthenticated: false, isLoading: false, token: null });
            return;
        }

        set({ isLoading: true, token });
        try {
            const response = await authAPI.getCurrentUser();
            set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('auth_token');
            set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
