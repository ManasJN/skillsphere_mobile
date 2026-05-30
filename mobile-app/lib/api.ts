import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { API_BASE_URL } from './config';

// ─── Central config ──────────────────────────────────────────────────────────
// Token storage key remains constant
export const TOKEN_STORAGE_KEY = 'skillsphere_jwt_token';

// ─── Axios instance ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Attach JWT to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    config.headers = config.headers ?? {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('[API] request interceptor error', error);
    }
    return Promise.reject(error);
  },
);

let meCache: Promise<any> | null = null;
const clearMeCache = () => { meCache = null; };

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error?.config?.url ?? '';
    const status = error?.response?.status;
    const isLoginOrRegister = url.includes('/auth/login') || url.includes('/auth/register');
    const isLogoutRequest = url.includes('/auth/logout');

    if (__DEV__) {
      const shouldLog = status !== 401 || (!isLoginOrRegister && !isLogoutRequest);
      if (shouldLog) {
        console.error('[API] response interceptor error', {
          message: error?.message,
          url,
          status,
          data: error?.response?.data,
        });
      }
    }

    if (status === 401) {
      clearMeCache();
      if (!isLoginOrRegister && !isLogoutRequest) {
        await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY]);
        router.replace('/'); // Route through auth gate for clean state reset
      }
    }

    return Promise.reject(error);
  },
);

// ─── API modules ─────────────────────────────────────────────────────────────

export const authAPI = {
  me: async () => {
    if (meCache) return meCache;
    meCache = api.get('/auth/me').catch((err) => { clearMeCache(); throw err; });
    return meCache;
  },
  login: (email: string, password: string) => {
    if (__DEV__) {
      console.log('[authAPI] login payload', { email, password });
    }
    clearMeCache();
    return api.post('/auth/login', { email, password });
  },
  register: (name: string, email: string, password: string, role: string) => {
    const serverRole = role;
    if (__DEV__) {
      console.log('[authAPI] register payload', { name, email, password, role: serverRole });
    }
    clearMeCache();
    return api.post('/auth/register', { name, email, password, role: serverRole });
  },
  verifyOtp: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }),
  logout: () => {
    clearMeCache();
    return api.post('/auth/logout');
  },
};

export const skillsAPI = {
  getMine: () => api.get('/skills'),
  create: (data: Record<string, unknown>) => api.post('/skills', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/skills/${id}`, data),
  delete: (id: string) => api.delete(`/skills/${id}`),
};

export const goalsAPI = {
  getMine:          (params?: Record<string, string>) => api.get('/goals', { params }),
  create:           (data: Record<string, unknown>)   => api.post('/goals', data),
  update:           (id: string, data: Record<string, unknown>) => api.put(`/goals/${id}`, data),
  delete:           (id: string) => api.delete(`/goals/${id}`),
  toggleMilestone:  (goalId: string, milestoneId: string) =>
    api.put(`/goals/${goalId}/milestones/${milestoneId}/toggle`),
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

export const opportunitiesAPI = {
  getAll: (params?: Record<string, string>) => api.get('/opportunities', { params }),
  getOne: (id: string) => api.get(`/opportunities/${id}`),
  apply:  (id: string) => api.post(`/opportunities/${id}/apply`),
};

export const usersAPI = {
  getById:           (id: string) => api.get(`/users/${id}`),
  update:            (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  updateCodingStats: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}/coding-stats`, data),
  /** Auto-fetches LeetCode stats by username via server-side GraphQL scrape */
  importLeetCode:    (id: string, username: string) =>
    api.put(`/users/${id}/import/leetcode`, { username }),
  /** Auto-fetches GitHub repos + profile by username via GitHub REST API */
  importGitHub:      (id: string, username: string) =>
    api.put(`/users/${id}/import/github`, { username }),
  addCert:           (id: string, formData: FormData) =>
    api.post(`/users/${id}/certifications`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const achievementsAPI = {
  getMine: () => api.get('/achievements/my'),
  getAll:  () => api.get('/achievements'),
};
