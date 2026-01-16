
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

    async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
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

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
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

    async updateOrgProfile(data: any) {
        return api.post('/api/public/organisation/profile', data);
    },
};

export const publicService = {
    async getTestimonials() {
        return api.get<any>('/api/public/testimonials');
    },

    async getSubscriptionPlans() {
        return api.get<any>('/api/subscriptions/active');
    },
};

export const faqService = {
    async listFaqs() {
        return api.get<any>('/api/public/faq');
    }
};

export const featureService = {
    async getFeatures(subscriptionId: number) {
        return api.get<any>(`/api/features/highlighted?subscription_id=${subscriptionId}`);
    }
};

export const sysAdminService = {
    // Feature Management
    async listFeatures() {
        return api.get<any>('/api/sysadmin/features');
    },

    async createFeature(data: { name: string; description: string }) {
        return api.post<any>('/api/sysadmin/features', data);
    },

    async updateFeature(featureId: number, data: { name?: string; description?: string }) {
        return api.put<any>(`/api/sysadmin/features/${featureId}`, data);
    },

    async deleteFeature(featureId: number) {
        return api.delete<any>(`/api/sysadmin/features/${featureId}`);
    },

    // FAQ Management
    async listFaqs() {
        return api.get<any>('/api/sysadmin/faq');
    },

    async createFaq(data: { question: string; answer: string; display_order: number; status: number; user_id: number }) {
        return api.post<any>('/api/sysadmin/faq', data);
    },

    async updateFaq(faqId: number, data: { question?: string; answer?: string; display_order?: number; status?: number; user_id?: number }) {
        return api.put<any>(`/api/sysadmin/faq/${faqId}`, data);
    },

    async deleteFaq(faqId: number) {
        return api.delete<any>(`/api/sysadmin/faq/${faqId}`);
    }

};

export const feedbackService = {
    async submitFeedback(data: { sender_id: number; title: string; rating: number; content: string }) {
        return api.post<any>('/api/feedback', data);
    }
};

