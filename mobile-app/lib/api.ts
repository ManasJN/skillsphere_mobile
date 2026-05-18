import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

export const API_BASE_URL = 'http://10.38.159.20:5000/api';
export const TOKEN_STORAGE_KEY = 'skillsphere_jwt_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token =
    (await AsyncStorage.getItem(TOKEN_STORAGE_KEY)) ?? (await AsyncStorage.getItem('ss_token'));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, 'ss_token', 'ss_user']);
      router.replace('/login' as never);
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  me: () => api.get('/auth/me'),
};

export const skillsAPI = {
  getMine: () => api.get('/skills'),
};

export const goalsAPI = {
  getMine: (params?: Record<string, string>) => api.get('/goals', { params }),
};

export const projectsAPI = {
  getMine: () => api.get('/projects'),
};

export const analyticsAPI = {
  myStats: () => api.get('/analytics/my-stats'),
};

export const collegesAPI = {
  search: (params?: Record<string, string>) => api.get('/colleges', { params }),
  studentUpdates: () => api.get('/colleges/student-updates'),
};

export const recommendationsAPI = {
  getDashboardSummary: () => api.get('/recommendations/dashboard-summary'),
};

export default api;
