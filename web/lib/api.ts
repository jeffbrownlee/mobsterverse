import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SignupData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  nickname: string | null;
  created_at: string;
}

export const authAPI = {
  signup: async (data: SignupData) => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post('/api/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/api/auth/verify-email', { token });
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post('/api/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/api/auth/reset-password', { token, newPassword });
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string, mfaToken?: string) => {
    const response = await api.post('/api/auth/change-password', { 
      currentPassword, 
      newPassword,
      mfaToken 
    });
    return response.data;
  },

  updateNickname: async (nickname: string) => {
    const response = await api.post('/api/auth/update-nickname', { nickname });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/api/auth/delete-account');
    localStorage.removeItem('auth_token');
    return response.data;
  },
};

export const mfaAPI = {
  setupMFA: async () => {
    const response = await api.post('/api/mfa/setup');
    return response.data as { secret: string; qrCode: string };
  },

  enableMFA: async (secret: string, token: string) => {
    const response = await api.post('/api/mfa/enable', { secret, token });
    return response.data;
  },

  disableMFA: async (password: string, token: string) => {
    const response = await api.post('/api/mfa/disable', { password, token });
    return response.data;
  },

  verifyMFA: async (token: string) => {
    const response = await api.post('/api/mfa/verify', { token });
    return response.data;
  },
};

export default api;
