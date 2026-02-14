const RAW_API_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const API_URL = RAW_API_URL.replace(/\/$/, "");
export interface ApiResponse<T = any> {
    ok: boolean;
    error?: string;
    [key: string]: any;
}

const buildAuthHeaders = () => {
    const headers: any = {};
    // DEV ONLY: Inject X-USER-ID for testing sysadmin features if not present
    // In a real app, you'd get this from a valid auth token or user state
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
    return headers;
};

export const api = {
    async request<T>(endpoint: string, method: string, data?: any): Promise<ApiResponse<T>> {
        const headers: any = {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(),
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

    async requestForm<T>(endpoint: string, method: string, formData: FormData): Promise<ApiResponse<T>> {
        const headers: any = {
            ...buildAuthHeaders(),
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers,
                body: formData,
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
    async getLandingImages() {
        return api.get<any>('/api/public/landing-images');
    },

    async getTestimonials() {
        return api.get<any>('/api/public/testimonials');
    },

    async getSubscriptionPlans() {
        return api.get<any>('/api/subscriptions/active');
    },

    async registerPatron(data: {
        username: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) {
        return api.post<any>('/api/public/patron/register', data);
    },

    async getFeaturedVideo() {
        return api.get<any>('/api/public/featured-video');
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

    async getFeaturedVideo() {
        return api.get<any>('/api/sysadmin/featured-video');
    },

    async updateFeaturedVideo(data: { url?: string; title?: string; description?: string }) {
        return api.put<any>('/api/sysadmin/featured-video', data);
    },

    async listUsers() {
        return api.get<any>('/api/sysadmin/users');
    },

    async listOrganisations() {
        return api.get<any>('/api/sysadmin/organisations');
    },

    async updateOrganisationStatus(organisationId: number, status: boolean) {
        return api.put<any>(`/api/sysadmin/organisations/${organisationId}/status`, { status });
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

    async createSubscription(data: { name: string; price: number; staff_user_limit: number; description?: string; status: number }) {
        return api.post<any>('/api/sysadmin/subscriptions', data);
    },

    async updateSubscription(subscriptionId: number, data: { name?: string; price?: number; staff_user_limit?: number; description?: string; status?: number }) {
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

    async getStaffCapacity(organisationId: number) {
        return api.get<any>(`/api/org-admin/staff-capacity?organisation_id=${organisationId}`);
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
    },

    async chatVoice(data: { organisation_id: number; audio: Blob; session_id?: string; user_id?: number }) {
        const form = new FormData();
        form.append('audio', data.audio, 'speech.webm');
        form.append('organisation_id', String(data.organisation_id));
        if (data.session_id) {
            form.append('session_id', data.session_id);
        }
        if (data.user_id) {
            form.append('user_id', String(data.user_id));
        }
        return api.requestForm<any>('/api/org-admin/chat-voice', 'POST', form);
    },

    // Quick Replies (clickable suggestions)
    async getQuickReplies(organisationId: number, params: { language?: string } = {}) {
        const query = new URLSearchParams(params as any);
        return api.get<any>(`/api/org-admin/quick-replies?organisation_id=${organisationId}&${query.toString()}`);
    },

    async updateQuickReplies(organisationId: number, data: { texts: string[]; language?: string }) {
        return api.put<any>(`/api/org-admin/quick-replies?organisation_id=${organisationId}`, data);
    },
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
    },

    async chatVoice(data: { organisation_id: number; audio: Blob; session_id?: string; user_id?: number }) {
        const form = new FormData();
        form.append('audio', data.audio, 'speech.webm');
        form.append('organisation_id', String(data.organisation_id));
        if (data.session_id) {
            form.append('session_id', data.session_id);
        }
        if (data.user_id) {
            form.append('user_id', String(data.user_id));
        }
        return api.requestForm<any>('/api/operator/chat-voice', 'POST', form);
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
        return api.put<any>(`/api/org-role-permissions/${roleId}/permissions`, {
            permission_ids: permissionIds
        });
    },

    async listPermissions() {
        return api.get('/api/org-role-permissions/permissions');
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

    async dismissNotification(userId: number, messageId: number) {
        return api.put<any>(
            `/api/notifications/${messageId}/dismiss`,
            { user_id: userId }
        );
    }
};

export const chatService = {
    async getMessages(companyId: number, sessionId: string, limit: number = 100) {
        const params = new URLSearchParams({
            company_id: String(companyId),
            session_id: sessionId,
            limit: String(limit),
        });
        return api.get<any>(`/api/chat/messages?${params.toString()}`);
    },

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
    async chatVoice(data: { organisation_id: number; audio: Blob; session_id?: string }) {
        const form = new FormData();
        form.append('audio', data.audio, 'speech.webm');
        form.append('organisation_id', String(data.organisation_id));
        if (data.session_id) {
            form.append('session_id', data.session_id);
        }
        return api.requestForm<any>('/api/patron/chat-voice', 'POST', form); //
    }
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

export const patronService = {
    async getChatDirectory() {
        return api.get<any>('/api/patron/chat-directory');
    }
};
