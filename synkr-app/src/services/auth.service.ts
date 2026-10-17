import type { AuthSession, MessageResponse } from '../types/api';
import { api } from './api';

// Endpoints de autenticação do backend (prefixo /api já está no baseURL)
export const authService = {
  register: (body: { name: string; email: string; password: string }) =>
    api.post<MessageResponse & { email: string }>('/auth/register', body).then((r) => r.data),

  verifyEmail: (body: { email: string; code: string }) =>
    api.post<AuthSession>('/auth/verify-email', body).then((r) => r.data),

  resendCode: (email: string) => api.post<MessageResponse>('/auth/resend-code', { email }).then((r) => r.data),

  login: (body: { email: string; password: string }) =>
    api.post<AuthSession>('/auth/login', body).then((r) => r.data),

  logout: () => api.post<MessageResponse>('/auth/logout').then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<MessageResponse>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    api.post<MessageResponse>('/auth/reset-password', body).then((r) => r.data),
};
