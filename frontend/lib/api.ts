/**
 * API Client for AI Teacher Backend
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    getGitHubLoginUrl: () => apiClient.get('/auth/github/login/'),
    getCurrentUser: () => apiClient.get('/auth/me/'),
    logout: () => apiClient.post('/auth/logout/'),
};

// Projects API
export const projectsAPI = {
    list: () => apiClient.get('/projects/'),
    get: (id: string) => apiClient.get(`/projects/${id}/`),
    create: (data: any) => apiClient.post('/projects/', data),
    generate: (data: any) => apiClient.post('/projects/generate/', data),
    update: (id: string, data: any) => apiClient.put(`/projects/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/projects/${id}/`),
};

// Tasks API
export const tasksAPI = {
    list: (params?: any) => apiClient.get('/tasks/', { params }),
    get: (id: string) => apiClient.get(`/tasks/${id}/`),
    create: (data: any) => apiClient.post('/tasks/', data),
    update: (id: string, data: any) => apiClient.put(`/tasks/${id}/`, data),
    submit: (id: string, data: any) => apiClient.post(`/tasks/${id}/submit/`, data),
    review: (id: string) => apiClient.post(`/tasks/${id}/review/`),
};

// Code Reviews API
export const reviewsAPI = {
    list: (params?: any) => apiClient.get('/reviews/', { params }),
    get: (id: string) => apiClient.get(`/reviews/${id}/`),
};

// Conversations API
export const conversationsAPI = {
    list: () => apiClient.get('/conversations/'),
    get: (id: string) => apiClient.get(`/conversations/${id}/`),
    create: (data: any) => apiClient.post('/conversations/', data),
    sendMessage: (id: string, content: string) =>
        apiClient.post(`/conversations/${id}/send_message/`, { content }),
};

export default apiClient;
