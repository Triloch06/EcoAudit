import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

api.interceptors.response.use((response) => {
    if (response.config.responseType === 'blob') {
        return response;
    }
    if (response.data && response.data.success !== undefined) {
        response.data = response.data.data;
    }
    return response;
}, (error) => {
    if (error.response && error.response.status === 429) {
        console.error('Rate limit exceeded');
    }
    return Promise.reject(error);
});

export const exportService = {
    exportExcel: async () => {
        const response = await api.get('/export/excel', { responseType: 'blob' });
        return window.URL.createObjectURL(new Blob([response.data]));
    },
    exportPdf: async () => {
        const response = await api.get('/export/pdf', { responseType: 'blob' });
        return window.URL.createObjectURL(new Blob([response.data]));
    },
};

export const logsService = {
    deleteLog: async (logId: string) => {
        return api.delete(`/logs/${logId}`);
    }
};
