
const API_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export interface ApiResponse<T = any> {
    ok: boolean;
    error?: string;
    [key: string]: any;
}

export const api = {
    async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { ok: false, error: 'Network error or server unreachable' };
        }
    },

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { ok: false, error: 'Network error or server unreachable' };
        }
    },
};

export const authService = {
    async register(data: any) {
        return api.post('/api/public/register', data);
    },

    async login(data: any) {
        return api.post('/api/public/login', data);
    },

    async verifyEmail(token: string) {
        return api.get(`/api/public/verify-email?token=${token}`);
    },
};


