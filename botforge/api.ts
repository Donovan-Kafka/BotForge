
const RAW_API_URL = import.meta.env.VITE_API_URL;

if (!RAW_API_URL) {
    throw new Error("VITE_API_URL is not defined");
}

const API_URL = RAW_API_URL.replace(/\/$/, "");
export interface ApiResponse<T = any> {
    ok: boolean;
    error?: string;
    [key: string]: any;
}

export const api = {
    async request<T>(endpoint: string, method: string, data?: any): Promise<ApiResponse<T>> {
        const headers: any = {
            'Content-Type': 'application/json',
        };

        // DEV ONLY: Inject X-USER-ID for testing sysadmin features if not present
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const u = JSON.parse(storedUser);
                if (u && u.user_id) {
                    headers['X-USER-ID'] = u.user_id.toString();
                    console.log("[DEBUG] api.ts: Injected header X-USER-ID:", headers['X-USER-ID']);
                }
            } catch (e) { /* ignore */ }
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { ok: false, error: 'Network error or server unreachable' };
        }
    },

    async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        return this.request(endpoint, 'POST', data);
    },

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request(endpoint, 'GET');
    },

    async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        return this.request(endpoint, 'PUT', data);
    },

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request(endpoint, 'DELETE');
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
        return api.get(`/api/public/verify-email?token=${encodeURIComponent(token)}`);
    },

    async updateOrgProfile(data: any) {
        return api.post('/api/public/organisation/profile', data);
    },

    async getOrgProfile(organisationId: number) {
        return api.get<any>(`/api/public/organisation/profile/${organisationId}`);
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
    async updateProfile(data: { user_id: number; username?: string; email?: string }) {
        return api.put<any>('/api/sysadmin/profile', data);
    },

    async changePassword(data: any) {
        return api.put<any>('/api/sysadmin/password', data);
    },

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
    async listUsers() {
        return api.get<any>('/api/sysadmin/users');
    },

    async listOrgRoles(organisationId: number) {
        return api.get<any>(`/api/sysadmin/org-roles?organisation_id=${organisationId}`);
    },
    async updateUserStatus(userId: number, status: boolean) {
        return api.put<any>(`/api/sysadmin/users/${userId}/status`, { status });
    },

    async updateUserRole(userId: number, data: { type: 'system' | 'org'; system_role_id?: number; org_role_id?: number }) {
        return api.put<any>(`/api/sysadmin/users/${userId}/role`, data);
    },
    async getDashboardUserStatus() {
        return api.get<any>('/api/sysadmin/dashboard/user-status');
    },

    async getDashboardDailyUsage(days: number = 7, metric: 'messages' | 'sessions' = 'messages') {
        return api.get<any>(`/api/sysadmin/dashboard/daily-usage?days=${days}&metric=${metric}`);
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
    },

    // Subscription Management
    async listSubscriptions() {
        return api.get<any>('/api/sysadmin/subscriptions');
    },

    async createSubscription(data: { name: string; price: number; description?: string; status: number }) {
        return api.post<any>('/api/sysadmin/subscriptions', data);
    },

    async updateSubscription(subscriptionId: number, data: { name?: string; price?: number; description?: string; status?: number }) {
        return api.put<any>(`/api/sysadmin/subscriptions/${subscriptionId}`, data);
    },

    async deleteSubscription(subscriptionId: number) {
        return api.delete<any>(`/api/sysadmin/subscriptions/${subscriptionId}`);
    },

    async getSubscriptionFeatures(subscriptionId: number) {
        return api.get<any>(`/api/sysadmin/subscriptions/${subscriptionId}/features`);
    },

    async updateSubscriptionFeatures(subscriptionId: number, featureIds: number[]) {
        return api.put<any>(`/api/sysadmin/subscriptions/${subscriptionId}/features`, { feature_ids: featureIds });
    },

    // Feedback Management
    async listFeedbackCandidates() {
        return api.get<any>('/api/sysadmin/feedback/candidates');
    },

    async featureFeedback(feedbackId: number, isTestimonial: boolean) {
        return api.post<any>('/api/sysadmin/testimonials/feature', { feedback_id: feedbackId, is_testimonial: isTestimonial });
    }


};

export const feedbackService = {
    async submitFeedback(data: { sender_id: number; purpose: string; rating: number; content: string }) {
        return api.post<any>('/api/feedback', data);
    }
};

export const orgAdminService = {
    async listOrgUsers(organisationId: number) {
        return api.get<any>(`/api/org-admin/users?organisation_id=${organisationId}`);
    },

    async updateAdminProfile(data: { user_id: number; username?: string; email?: string }) {
        return api.put<any>('/api/org-admin/profile', data);
    },

    async changePassword(data: any) {
        return api.put<any>('/api/org-admin/password', data);
    },

    async updateUserRole(userId: number, newRoleId: number) {
        return api.put<any>(`/api/org-admin/users/${userId}/role`, { new_org_role_id: newRoleId });
    },

    // Chatbot Management
    async getChatbotSettings(organisationId: number) {
        return api.get<any>(`/api/org-admin/chatbot?organisation_id=${organisationId}`);
    },

    async updateChatbotSettings(organisationId: number, data: any) {
        return api.put<any>(`/api/org-admin/chatbot?organisation_id=${organisationId}`, data);
    },

    async listPersonalities() {
        return api.get<any>('/api/org-admin/personalities');
    },

    // Chat History
    async getChatHistory(organisationId: number, params: { q?: string; from?: string; to?: string; page?: number; page_size?: number } = {}) {
        const query = new URLSearchParams(params as any);
        return api.get<any>(`/api/org-admin/chat-history?organisation_id=${organisationId}&${query.toString()}`);
    },

    // Analytics
    async getChatbotAnalytics(organisationId: number, params: { from?: string; to?: string } = {}) {
        const query = new URLSearchParams(params as any);
        return api.get<any>(`/api/org-admin/analytics?organisation_id=${organisationId}&${query.toString()}`);
    },

    // Invitations
    async sendInvitation(data: { email: string; organisation_id: number; invited_by_user_id: number }) {
        return api.post<any>('/api/admin/invitations', data);
    }
};

export const operatorService = {
    // Invitation & Registration
    async validateInvitation(token: string) {
        return api.get<any>(`/api/operator/invitations/validate?token=${token}`);
    },

    async register(data: any) {
        return api.post<any>('/api/operator/register', data);
    },

    async updateProfile(data: { user_id: number; username?: string; email?: string }) {
        return api.put<any>('/api/operator/profile', data);
    },

    async changePassword(data: any) {
        return api.put<any>('/api/operator/password', data);
    },

    async deleteAccount(userId: number) {
        return api.request<any>('/api/operator/account', 'DELETE', { user_id: userId });
    },

    // Chatbot Management
    async getChatbotSettings(organisationId: number) {
        return api.get<any>(`/api/operator/chatbot?organisation_id=${organisationId}`);
    },

    async updateChatbotSettings(organisationId: number, data: any) {
        return api.put<any>(`/api/operator/chatbot?organisation_id=${organisationId}`, data);
    },

    async listPersonalities() {
        return api.get<any>('/api/operator/personalities');
    },

    // Chat History
    async getChatHistory(organisationId: number, params: { q?: string; from?: string; to?: string; page?: number; page_size?: number } = {}) {
        const query = new URLSearchParams(params as any);
        return api.get<any>(`/api/operator/chat-history?organisation_id=${organisationId}&${query.toString()}`);
    },

    // Analytics
    async getChatbotAnalytics(organisationId: number, params: { from?: string; to?: string } = {}) {
        const query = new URLSearchParams(params as any);
        return api.get<any>(`/api/operator/analytics?organisation_id=${organisationId}&${query.toString()}`);
    }
};

export const orgRoleService = {
    async listRoles(organisationId: number) {
        return api.get<any>(`/api/org-roles/?organisation_id=${organisationId}`);
    },

    async createRole(data: { organisation_id: number; name: string; description?: string }) {
        return api.post<any>('/api/org-roles/', data);
    },

    async updateRole(roleId: number, data: { name?: string; description?: string }) {
        return api.put<any>(`/api/org-roles/${roleId}`, data);
    },

    async deleteRole(roleId: number) {
        return api.delete<any>(`/api/org-roles/${roleId}`);
    },

    async assignPermissions(roleId: number, permissionIds: number[]) {
        return api.put<any>(`/api/org-roles/${roleId}/permissions`, { permission_ids: permissionIds });
    }
};

export const subscriptionService = {
    async assignSubscription(data: { user_id: number; subscription_id: number }) {
        return api.post('/api/subscriptions/assign', data);
    }
};

export const notificationService = {
    async listNotifications(userId: number) {
        return api.get<any>(`/api/notifications/?user_id=${userId}`);
    },

    async markAsRead(userId: number, messageId: number) {
        return api.put<any>(`/api/notifications/${messageId}/read`, { user_id: userId });
    },

    async deleteNotification(userId: number, messageId: number) {
        // DELETE requests with body are non-standard but Flask accepts them.
        // However, standard fetch might strip body from DELETE. 
        // Let's adhere to the backend requirement which expects JSON body for user_id.
        return api.request<any>(`/api/notifications/${messageId}`, 'DELETE', { user_id: userId });
    }
};

export const chatService = {
    async welcome(companyId: number, sessionId?: string) {
        const params = new URLSearchParams({ company_id: String(companyId) });
        if (sessionId) {
            params.set('session_id', sessionId);
        }
        return api.get<any>(`/api/chat/welcome?${params.toString()}`);
    },

    async chat(data: { company_id: number; message: string; session_id?: string; user_id?: number }) {
        return api.post<any>('/api/chat', data);
    },
};

export const statsService = {
    async getSystemStats() {
        // This connects to the data generated by the backend's User and Org models
        return api.get<any>('/api/sysadmin/users'); // Use existing user data to calculate breakdowns
    },
    async generateReport(params: { from: string; to: string; type: 'PDF' | 'XLS' }) {
        const query = new URLSearchParams(params).toString();
        return api.get<any>(`/api/sysadmin/reports?${query}`);
    }
};
