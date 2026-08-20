import apiClient from './client';
import {
  User,
  Employee,
  EmployeeCreatePayload,
  EmployeeUpdatePayload,
  DashboardStats,
  SyncResponse,
  DocumentTemplate,
  GeneratedDocument,
  DocumentFormData
} from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  me: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  updateProfile: async (data: { full_name?: string; email?: string }): Promise<User> => {
    const res = await apiClient.put('/auth/profile', data);
    return res.data;
  },
  changePassword: async (old_password: string, new_password: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post('/auth/change-password', { old_password, new_password });
    return res.data;
  },
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string; email: string; dev_otp?: string }> => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (email: string, otp: string, new_password: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post('/auth/reset-password', { email, otp, new_password });
    return res.data;
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

export const employeesApi = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
    department?: string;
    pending_id_only?: boolean;
  }): Promise<{ total: number; items: Employee[]; skip: number; limit: number }> => {
    const res = await apiClient.get('/employees', { params });
    return res.data;
  },
  get: async (id: number): Promise<Employee> => {
    const res = await apiClient.get(`/employees/${id}`);
    return res.data;
  },
  create: async (data: EmployeeCreatePayload): Promise<Employee> => {
    const res = await apiClient.post('/employees', data);
    return res.data;
  },
  update: async (id: number, data: EmployeeUpdatePayload): Promise<Employee> => {
    const res = await apiClient.put(`/employees/${id}`, data);
    return res.data;
  },
  assignId: async (id: number, employeeId: string): Promise<Employee> => {
    const res = await apiClient.put(`/employees/${id}/assign-id`, { employee_id: employeeId });
    return res.data;
  },
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/employees/${id}`);
    return res.data;
  },
  sync: async (): Promise<SyncResponse> => {
    const res = await apiClient.post('/employees/sync');
    return res.data;
  },
  uploadExcel: async (file: File): Promise<SyncResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/employees/upload-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const documentsApi = {
  preview: async (data: DocumentFormData): Promise<{ success: boolean; html: string; document_type: string }> => {
    const res = await apiClient.post('/documents/preview', data);
    return res.data;
  },
  generate: async (data: DocumentFormData & { save_history?: boolean }): Promise<GeneratedDocument> => {
    const res = await apiClient.post('/documents/generate', data);
    return res.data;
  },
  getHistory: async (skip = 0, limit = 50): Promise<GeneratedDocument[]> => {
    const res = await apiClient.get('/documents/history', { params: { skip, limit } });
    return res.data;
  },
  getEmployeeHistory: async (employeeId: number): Promise<GeneratedDocument[]> => {
    const res = await apiClient.get(`/documents/employee/${employeeId}`);
    return res.data;
  },
  getDownloadUrl: (id: number): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    return `${baseUrl}/documents/${id}/download`;
  },
  downloadDocument: async (id: number, filename?: string) => {
    const res = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `document_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  sendEmail: async (
    docId: number,
    payload: {
      recipient_email: string;
      recipient_name: string;
      subject?: string;
      custom_message?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post(`/documents/${docId}/send-email`, payload);
    return res.data;
  },
};


export const templatesApi = {
  list: async (): Promise<DocumentTemplate[]> => {
    const res = await apiClient.get('/templates');
    return res.data;
  },
  getByType: async (type: string): Promise<DocumentTemplate> => {
    const res = await apiClient.get(`/templates/${type}`);
    return res.data;
  },
};
