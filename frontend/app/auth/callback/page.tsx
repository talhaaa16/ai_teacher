'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Store token and fetch user
            login(token).then(() => {
                router.push('/dashboard');
            }).catch((error) => {
                console.error('Login failed:', error);
                router.push('/login');
            });
        } else {
            // No token, redirect to login
            router.push('/login');
        }
    }, [searchParams, login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing authentication...</p>
            </div>
        </div>
    );
}
