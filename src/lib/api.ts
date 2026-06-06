const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  token?: string;
  user?: T;
  message?: string;
  count?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Error en la solicitud');
    }

    return data;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============ AUTH METHODS ============

  async login(email: string, password: string) {
    return this.request<{
      id: string;
      email: string;
      name: string;
      role: string;
      department: string | null;
      avatar: string | null;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'x-frontend': 'william' },
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
    dni?: string;
    phone?: string;
    location?: string;
    specialty?: string;
  }) {
    return this.post<{
      id: string;
      email: string;
      name: string;
      role: string;
      department: string | null;
      createdAt: string;
      dni?: string;
      phone?: string;
      location?: string;
      specialty?: string;
    }>('/api/auth/register', data);
  }

  async getMe() {
    return this.get<{
      id: string;
      email: string;
      name: string;
      role: string;
      department: string | null;
      avatar: string | null;
      isActive: boolean;
      createdAt: string;
      dni?: string;
      phone?: string;
      location?: string;
      specialty?: string;
    }>('/api/auth/me');
  }

  // ============ WILLIAM DASHBOARD METHODS ============

  async getDashboardOverview(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.get<{
      stats: {
        totalProposals: number;
        drafts: number;
        pending: number;
        inEvaluation: number;
        approved: number;
        rejected: number;
      };
      proposalsByType: { curso: number; taller: number; diplomado: number };
      recentProposals: Array<Record<string, unknown>>;
      pendingEvaluationsForUser: number | null;
      avgApprovalDays: number | null;
      upcomingDeadlines: Array<Record<string, unknown>>;
      systemNotifications: Array<Record<string, unknown>>;
    }>(`/api/william/dashboard/overview${query}`);
  }

  // ============ SHARED DASHBOARD METHODS ============

  async createKPI(data: { name: string; value: number; target?: number; type?: string; category?: string }) {
    return this.post<Record<string, unknown>>('/api/dashboard/kpis', data);
  }

  async updateKPI(id: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/dashboard/kpis/${id}`, data);
  }

  // ============ SYSTEM SETTINGS METHODS ============

  async getSystemSettings() {
    return this.get<Array<Record<string, unknown>>>('/api/system-settings');
  }

  async getSystemSetting(key: string) {
    return this.get<Record<string, unknown>>(`/api/system-settings/${key}`);
  }

  async getSettingsByCategory(category: string) {
    return this.get<Array<Record<string, unknown>>>(`/api/system-settings/category/${category}`);
  }

  async upsertSetting(data: { key: string; value: string; category?: string; description?: string }) {
    return this.post<Record<string, unknown>>('/api/system-settings', data);
  }

  async updateMultipleSettings(data: { settings: Array<{ key: string; value: string }> }) {
    return this.put<Record<string, unknown>>('/api/system-settings/bulk', data);
  }

  async deleteSetting(key: string) {
    return this.delete<{ message: string }>(`/api/system-settings/${key}`);
  }

  // ============ PROPOSAL METHODS ============

  async getProposals(params?: { status?: string; type?: string; proposerId?: string }) {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined))
    ).toString() : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/proposals${query}`);
  }

  async getProposal(id: string) {
    return this.get<Record<string, unknown>>(`/api/william/proposals/${id}`);
  }

  async createProposal(data: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/william/proposals', data);
  }

  async updateProposal(id: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/william/proposals/${id}`, data);
  }

  async updateProposalStatus(id: string, data: { status: string; userId?: string; comments?: string; role?: string }) {
    return this.request<Record<string, unknown>>(`/api/william/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProposal(id: string, requestedByUserId?: string) {
    const query = requestedByUserId ? `?requestedByUserId=${requestedByUserId}` : '';
    return this.delete<{ message: string }>(`/api/william/proposals/${id}${query}`);
  }

  // ============ PROPOSAL OBJECTIVES METHODS ============

  async getObjectives(proposalId: string) {
    return this.get<Array<Record<string, unknown>>>(`/api/william/proposals/${proposalId}/objectives`);
  }

  async addObjective(proposalId: string, data: { objective: string; order?: number }) {
    return this.post<Record<string, unknown>>(`/api/william/proposals/${proposalId}/objectives`, data);
  }

  async updateObjective(id: string, data: { objective?: string; order?: number }) {
    return this.put<Record<string, unknown>>(`/api/william/proposals/objectives/${id}`, data);
  }

  async deleteObjective(id: string) {
    return this.delete<{ message: string }>(`/api/william/proposals/objectives/${id}`);
  }

  async reorderObjectives(proposalId: string, data: { orders: Array<{ id: string; order: number }> }) {
    return this.request<Record<string, unknown>>(`/api/william/proposals/${proposalId}/objectives/reorder`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============ EVALUATOR ASSIGNMENT METHODS ============

  async assignEvaluators(proposalId: string, data: { evaluatorIds: string[] }) {
    return this.post<Record<string, unknown>>(`/api/william/proposals/${proposalId}/evaluators`, data);
  }

  async uploadProposalDocuments(proposalId: string, formData: FormData) {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/api/william/proposals/${proposalId}/documents`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Error uploading documents');
    }
    return data;
  }

  async deleteProposalDocument(proposalId: string, docId: string, userId: string) {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/api/william/proposals/${proposalId}/documents/${docId}?requestedByUserId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al eliminar el documento');
    }
    return data;
  }

  // ============ EVALUATION METHODS ============

  async getEvaluations(params?: { proposalId?: string; evaluatorId?: string; status?: string }) {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined))
    ).toString() : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/evaluations${query}`);
  }

  async getEvaluation(id: string) {
    return this.get<Record<string, unknown>>(`/api/william/evaluations/${id}`);
  }

  async createEvaluation(data: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/william/evaluations', data);
  }

  async updateEvaluation(id: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/william/evaluations/${id}`, data);
  }

  async getEvaluationCriteria() {
    return this.get<Array<Record<string, unknown>>>('/api/william/evaluations/criteria');
  }

  async createEvaluationCriterion(data: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/william/evaluations/criteria', data);
  }

  async updateEvaluationCriterion(id: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/william/evaluations/criteria/${id}`, data);
  }

  async deleteEvaluationCriterion(id: string) {
    return this.delete<{ message: string }>(`/api/william/evaluations/criteria/${id}`);
  }

  async deleteEvaluation(id: string) {
    return this.delete<{ message: string }>(`/api/william/evaluations/${id}`);
  }

  // ============ USER METHODS ============

  async getUsers() {
    return this.get<Array<Record<string, unknown>>>('/api/users');
  }

  async getUser(id: string) {
    return this.get<Record<string, unknown>>(`/api/users/${id}`);
  }

  async updateUser(id: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/users/${id}`, data);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post<Record<string, unknown>>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async updateProfile(data: { name?: string; email?: string; department?: string | null; dni?: string; phone?: string; location?: string; specialty?: string }) {
    return this.put<{
      id: string; name: string; email: string; role: string; department: string | null; avatar: string | null; isActive: boolean;
    }>('/api/auth/profile', data);
  }

  async uploadAvatar(file: File): Promise<{ file: { url: string; filename: string } }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/api/william/uploads/single`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al subir avatar');
    }
    return data;
  }

  // ============ WORKFLOW TEMPLATE METHODS ============

  async getWorkflowTemplates() {
    return this.get<Array<Record<string, unknown>>>('/api/william/workflow-templates');
  }

  async getWorkflowTemplate(id: string) {
    return this.get<Record<string, unknown>>(`/api/william/workflow-templates/${id}`);
  }

  async getDefaultWorkflowTemplate(proposalType?: string) {
    const query = proposalType ? `?proposalType=${proposalType}` : '';
    return this.get<Record<string, unknown>>(`/api/william/workflow-templates/default${query}`);
  }

  async createWorkflowTemplate(data: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/william/workflow-templates', data);
  }

  async updateWorkflowTemplate(id: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/william/workflow-templates/${id}`, data);
  }

  async deleteWorkflowTemplate(id: string) {
    return this.delete<{ message: string }>(`/api/william/workflow-templates/${id}`);
  }

  async addWorkflowTemplateStep(templateId: string, data: Record<string, unknown>) {
    return this.post<Record<string, unknown>>(`/api/william/workflow-templates/${templateId}/steps`, data);
  }

  async updateWorkflowTemplateStep(stepId: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/william/workflow-templates/steps/${stepId}`, data);
  }

  async deleteWorkflowTemplateStep(stepId: string) {
    return this.delete<{ message: string }>(`/api/william/workflow-templates/steps/${stepId}`);
  }

  async reorderWorkflowTemplateSteps(templateId: string, data: { stepOrders: Array<{ id: string; order: number }> }) {
    return this.request<Record<string, unknown>>(`/api/william/workflow-templates/${templateId}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============ DEPARTMENT METHODS ============

  async getDepartments() {
    return this.get<Array<Record<string, unknown>>>('/api/cristopher/departments');
  }

  // ============ NOTIFICATION METHODS ============

  async getNotifications(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.get<Array<Record<string, unknown>>>(`/api/notifications${query}`);
  }

  // ============ NOTIFICATION CRUD METHODS ============

  async createNotification(data: { title: string; message: string; type?: string; userId?: string; metadata?: Record<string, unknown> }) {
    return this.post<Record<string, unknown>>('/api/notifications', data);
  }

  async markNotificationAsRead(id: string) {
    return this.request<Record<string, unknown>>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.request<Record<string, unknown>>('/api/notifications/read-all', {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    });
  }

  async deleteNotification(id: string) {
    return this.delete<{ message: string }>(`/api/notifications/${id}`);
  }

  async clearAllNotifications(userId: string) {
    return this.delete<{ message: string }>(`/api/notifications?userId=${userId}`);
  }

  // ============ USER NOTIFICATION PREFERENCE METHODS ============

  async getNotificationPreferences(userId: string) {
    return this.get<Record<string, unknown>>(`/api/users/${userId}/notification-preferences`);
  }

  async updateNotificationPreferences(userId: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/users/${userId}/notification-preferences`, data);
  }

  async toggleNotificationPreference(userId: string, type: string) {
    return this.request<Record<string, unknown>>(`/api/users/${userId}/notification-preferences/${type}`, {
      method: 'PATCH',
    });
  }

  // ============ PROPONENTE DASHBOARD METHODS ============

  async getProponenteStats(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.get<Record<string, unknown>>(`/api/william/proponente/stats${query}`);
  }

  async getRecentProposals(userId?: string, limit?: number, page?: number) {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (limit) params.set('limit', limit.toString());
    if (page) params.set('page', page.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.get<{ data: Array<Record<string, unknown>>; total: number; page: number; totalPages: number }>(`/api/william/proponente/recent${query}`);
  }

  async getActionSuggestions(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/proponente/suggestions${query}`);
  }

  async getPerformanceMetrics(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.get<Record<string, unknown>>(`/api/william/proponente/metrics${query}`);
  }

  async getProponenteChartData(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.get<{ proposalsByType: Array<{ name: string; value: number }>; proposalsByMonth: Array<{ name: string; creadas: number }>; proposalsByModality: Array<{ name: string; value: number }> }>(`/api/william/proponente/chart-data${query}`);
  }

  async getAllProposalsTracking(userId?: string, page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.get<{ data: Array<Record<string, unknown>>; total: number; page: number; totalPages: number }>(`/api/william/proponente/tracking${query}`);
  }

  async getProposalTracking(proposalId: string) {
    return this.get<Record<string, unknown>>(`/api/william/proponente/tracking/${proposalId}`);
  }

  // ============ EVALUATOR DASHBOARD METHODS ============

  async getEvaluatorStats() {
    return this.get<Record<string, unknown>>('/api/william/evaluator/stats');
  }

  async getAssignedProposals() {
    return this.get<Array<Record<string, unknown>>>('/api/william/evaluator/assigned-proposals');
  }

  async getAllEvaluatorEvaluations() {
    return this.get<Array<Record<string, unknown>>>('/api/william/evaluator/evaluations');
  }

  async getEvaluationHistory() {
    return this.get<Array<Record<string, unknown>>>('/api/william/evaluator/history');
  }

  async getRecentEvaluations() {
    return this.get<Array<Record<string, unknown>>>('/api/william/evaluator/recent');
  }

  async getEvaluatorProfile() {
    return this.get<Record<string, unknown>>('/api/william/evaluator/profile');
  }

  async updateEvaluatorProfile(data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>('/api/william/evaluator/profile', data);
  }

  async updateAvailability(data: { available: boolean; startDate?: string; endDate?: string }) {
    return this.put<Record<string, unknown>>('/api/william/evaluator/availability', data);
  }

  async updateExpertise(data: { areas: string[] }) {
    return this.put<Record<string, unknown>>('/api/william/evaluator/expertise', data);
  }

  // ============ FACILITATOR METHODS (WILLIAM) ============

  async getMyActivities() {
    return this.get<Array<Record<string, unknown>>>('/api/william/facilitator/my-activities');
  }

  async getFacilitatorActivityById(id: string) {
    return this.get<Record<string, unknown>>(`/api/william/facilitator/activities/${id}`);
  }

  // ============ ADMIN METHODS ============

  // Stats
  async getAdminGlobalStats() {
    return this.get<Record<string, unknown>>('/api/william/admin/stats');
  }

  async getAdminTrends() {
    return this.get<Record<string, unknown>>('/api/william/admin/stats/trends');
  }

  async getAdminTypeDistribution() {
    return this.get<Record<string, unknown>>('/api/william/admin/stats/distribution');
  }

  async getSuperDashboard() {
    return this.get<Record<string, unknown>>('/api/william/admin/stats/super-dashboard');
  }

  // Activity & Tasks
  async getAdminRecentActivity() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/activity');
  }

  async getAdminPendingTasks() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/tasks');
  }

  // Proposals & Evaluators (Admin view)
  async getAllProposalsAdmin(params?: { status?: string; type?: string; page?: number; limit?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/admin/proposals${query}`);
  }

  async getAdminAllEvaluations(params?: { status?: string; evaluatorId?: string; page?: number; limit?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return this.get<{ data: Record<string, unknown>[]; pagination: any }>(`/api/william/admin/evaluations/all${query}`);
  }

  async getUnassignedProposals() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/unassigned-proposals');
  }

  async getAdminEvaluators() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/evaluators');
  }

  async getEvaluatorPerformance() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/evaluators/performance');
  }

  // Assignments
  async getAssignmentQueue() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/assignments/queue');
  }

  async getAssignmentStats() {
    return this.get<Record<string, unknown>>('/api/william/admin/assignments/stats');
  }

  async getAvailableEvaluators() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/available-evaluators');
  }

  async adminAssignEvaluators(data: { proposalId: string; evaluatorIds: string[] }) {
    return this.post<Record<string, unknown>>('/api/william/admin/assign-evaluators', data);
  }

  async removeEvaluator(proposalId: string, evaluatorId: string) {
    return this.delete<{ message: string }>(`/api/william/admin/proposals/${proposalId}/evaluators/${evaluatorId}`);
  }

  // Audit & Config
  async getAuditLog() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/audit-log');
  }

  async getSystemConfig() {
    return this.get<Record<string, unknown>>('/api/william/admin/config');
  }

  async updateSystemConfig(data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>('/api/william/admin/config', data);
  }

  // Reports (Admin)
  async getReportTemplates() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/reports/templates');
  }

  async getReportHistory() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/reports/history');
  }

  async getAvailableReports() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/reports/available');
  }

  async createCustomReport(data: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/william/admin/reports/custom', data);
  }

  async scheduleReport(data: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/william/admin/reports/schedule', data);
  }

  async generateReport(type: string) {
    return this.post<Record<string, unknown>>(`/api/william/admin/reports/${type}`, {});
  }

  async getReportData(reportId: string) {
    return this.get<Record<string, unknown>>(`/api/william/admin/reports/${reportId}/data`);
  }

  async exportReport(reportId: string, format?: string) {
    const query = format ? `?format=${format}` : '';
    return this.get<Record<string, unknown>>(`/api/william/admin/reports/${reportId}/export${query}`);
  }

  // User Management (Admin)
  async getAdminUsers(params?: { role?: string; isActive?: boolean; page?: number; limit?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/admin/users${query}`);
  }

  async getAdminUser(id: string) {
    return this.get<Record<string, unknown>>(`/api/william/admin/users/${id}`);
  }

  async createAdminUser(data: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/william/admin/users', data);
  }

  async updateAdminUser(id: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/william/admin/users/${id}`, data);
  }

  async deleteAdminUser(id: string) {
    return this.delete<{ message: string }>(`/api/william/admin/users/${id}`);
  }

  async resetUserPassword(id: string, data: { newPassword?: string }) {
    return this.post<Record<string, unknown>>(`/api/william/admin/users/${id}/reset-password`, data);
  }

  async getAdminSpecialties() {
    return this.get<{ success: boolean; data: string[] }>('/api/william/admin/specialties');
  }

  async bulkUserOperations(data: { action: string; userIds: string[]; data?: Record<string, unknown> }) {
    return this.post<Record<string, unknown>>('/api/william/admin/users/bulk', data);
  }

  async exportUsers() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/users/export');
  }

  async importUsers(data: { users: Array<Record<string, unknown>> }) {
    return this.post<Record<string, unknown>>('/api/william/admin/users/import', data);
  }

  async inviteUsers(data: { emails: string[]; role: string }) {
    return this.post<Record<string, unknown>>('/api/william/admin/users/invite', data);
  }

  // Extended Assignment Management
  async getAssignmentRecommendations(proposalId?: string) {
    const query = proposalId ? `?proposalId=${proposalId}` : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/admin/assignments/recommendations${query}`);
  }

  async getAssignmentHistory() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/assignments/history');
  }

  async getEvaluatorWorkload(evaluatorId: string) {
    return this.get<Record<string, unknown>>(`/api/william/admin/evaluators/${evaluatorId}/workload`);
  }

  async autoAssignProposals(data: { proposalIds: string[] }) {
    return this.post<Record<string, unknown>>('/api/william/admin/assignments/auto-assign', data);
  }

  async reassignProposal(proposalId: string, data: { newEvaluatorIds: string[]; reason?: string }) {
    return this.post<Record<string, unknown>>(`/api/william/admin/assignments/${proposalId}/reassign`, data);
  }

  async createAssignment(data: { proposalId: string; evaluatorId: string; dueDate?: string }) {
    return this.post<Record<string, unknown>>('/api/william/admin/assignments', data);
  }

  async updateAssignment(assignmentId: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/william/admin/assignments/${assignmentId}`, data);
  }

  async deleteAssignment(assignmentId: string) {
    return this.delete<{ message: string }>(`/api/william/admin/assignments/${assignmentId}`);
  }

  // System Management
  async createBackup() {
    return this.post<Record<string, unknown>>('/api/william/admin/system/backup', {});
  }

  async restoreBackup(backupId: string) {
    return this.post<Record<string, unknown>>(`/api/william/admin/system/backup/${backupId}/restore`, {});
  }

  async getBackupSettings() {
    return this.get<Record<string, unknown>>('/api/william/admin/system/backup/settings');
  }

  async getEmailSettings() {
    return this.get<Record<string, unknown>>('/api/william/admin/system/email');
  }

  async updateEmailSettings(data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>('/api/william/admin/system/email', data);
  }

  async getNotificationSettings() {
    return this.get<Record<string, unknown>>('/api/william/admin/system/notification-settings');
  }

  async updateNotificationSettings(data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>('/api/william/admin/system/notifications', data);
  }

  async getSystemLogs(params?: { level?: string; page?: number; limit?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/admin/system/logs${query}`);
  }

  async getSecuritySettings() {
    return this.get<Record<string, unknown>>('/api/william/admin/system/security');
  }

  async updateSecuritySettings(data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>('/api/william/admin/system/security', data);
  }

  async getSystemStatus() {
    return this.get<Record<string, unknown>>('/api/william/admin/system/status');
  }

  async getIntegrationSettings() {
    return this.get<Array<Record<string, unknown>>>('/api/william/admin/system/integrations');
  }

  async updateIntegrationSettings(integrationId: string, data: Record<string, unknown>) {
    return this.put<Record<string, unknown>>(`/api/william/admin/system/integrations/${integrationId}`, data);
  }

  // Audit
  async getAdminAuditLogs(params?: { action?: string; userId?: string; page?: number; limit?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/admin/audit/logs${query}`);
  }

  async getAdminAuditStats() {
    return this.get<Record<string, unknown>>('/api/william/admin/audit/stats');
  }

  async getSecurityEvents(params?: { severity?: string; page?: number; limit?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return this.get<Array<Record<string, unknown>>>(`/api/william/admin/audit/security-events${query}`);
  }

  async getComplianceReport() {
    return this.get<Record<string, unknown>>('/api/william/admin/audit/compliance');
  }

  async getRiskAssessment() {
    return this.get<Record<string, unknown>>('/api/william/admin/audit/risk-assessment');
  }

  async getAuditDetails(eventId: string) {
    return this.get<Record<string, unknown>>(`/api/william/admin/audit/events/${eventId}`);
  }

  async exportAuditLogs(data: { format?: string; dateRange?: { start: string; end: string } }) {
    return this.post<Record<string, unknown>>('/api/william/admin/audit/export', data);
  }

  // ============ GLOBAL NOTIFICATIONS ============

  async getGlobalNotifications(page = 1, limit = 50) {
    return this.get<{ data: Record<string, unknown>[]; pagination: any }>(`/api/william/admin/notifications/global?page=${page}&limit=${limit}`);
  }

  async getActiveGlobalNotifications() {
    return this.get<{ data: Record<string, unknown>[] }>('/api/notifications/global/active');
  }

  async createGlobalNotification(data: { title: string; message: string; type?: string; priority?: string }) {
    return this.post<Record<string, unknown>>('/api/william/admin/notifications/global', data);
  }

  async toggleGlobalNotification(id: string, isActive: boolean) {
    return this.put<Record<string, unknown>>(`/api/william/admin/notifications/global/${id}/toggle`, { isActive });
  }

  async deleteGlobalNotification(id: string) {
    return this.delete<{ data: { id: string } }>(`/api/william/admin/notifications/global/${id}`);
  }

  async getAdminAllNotifications(params?: { type?: string; userId?: string; page?: number; limit?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return this.get<{ data: Record<string, unknown>[]; pagination: any }>(`/api/william/admin/notifications/all${query}`);
  }

  async getDocumentBlob(fileUrl: string): Promise<Blob | null> {
    const token = this.getToken();
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${this.baseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    try {
      const response = await fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return null;
      return response.blob();
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient(API_BASE_URL);
