import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

// ─── Central config ──────────────────────────────────────────────────────────
// Replace this IP with your machine's LAN IP when it changes.
// On Android physical device + Expo Go, localhost won't work — use the LAN IP.
export const API_BASE_URL = 'http://10.38.159.20:5000/api';
export const TOKEN_STORAGE_KEY = 'skillsphere_jwt_token';

// ─── Axios instance ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY]);
      router.replace('/login');
    }
    return Promise.reject(error);
  },
);

// ─── API modules ─────────────────────────────────────────────────────────────

export const authAPI = {
  me: () => api.get('/auth/me'),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  // Backend expects "name", not "fullName"
  register: (name: string, email: string, password: string, role: string) =>
    api.post('/auth/register', { name, email, password, role }),
  verifyOtp: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }),
  logout: () => api.post('/auth/logout'),
};

export const skillsAPI = {
  getMine: () => api.get('/skills'),
  create: (data: Record<string, unknown>) => api.post('/skills', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/skills/${id}`, data),
  delete: (id: string) => api.delete(`/skills/${id}`),
};

export const goalsAPI = {
  getMine: (params?: Record<string, string>) => api.get('/goals', { params }),
  create: (data: Record<string, unknown>) => api.post('/goals', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
};

export const projectsAPI = {
  getMine: () => api.get('/projects'),
  create: (data: Record<string, unknown>) => api.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const analyticsAPI = {
  myStats: () => api.get('/analytics/my-stats'),
  overview: () => api.get('/analytics/overview'),
};

export const leaderboardAPI = {
  get: () => api.get('/leaderboard'),
  departmentSummary: () => api.get('/leaderboard/department-summary'),
};

export const notificationsAPI = {
  getMine: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
};

export const collegesAPI = {
  search: (params?: Record<string, string>) => api.get('/colleges', { params }),
  studentUpdates: () => api.get('/colleges/student-updates'),
};

export const recommendationsAPI = {
  getDashboardSummary: () => api.get('/recommendations/dashboard-summary'),
  getLatest: () => api.get('/recommendations/latest'),
  generate: () => api.post('/recommendations/generate'),
};

export default api;
