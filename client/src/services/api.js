import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://10.38.159.20:5000/api',
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ss_token');
      localStorage.removeItem('ss_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)           => api.post('/auth/register', data),
  registerCollege: (data)    => api.post('/auth/register-college', data),
  verifyOtp: (data)          => api.post('/auth/verify-otp', data),
  login:    (data)           => api.post('/auth/login', data),
  me:       ()               => api.get('/auth/me'),
  logout:   ()               => api.post('/auth/logout'),
  changePassword: (data)     => api.put('/auth/change-password', data),
};

export const collegesAPI = {
  search: (params) => api.get('/colleges', { params }),
  me: () => api.get('/colleges/me'),
  uploadDocuments: (data) => api.put('/colleges/me/documents', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  studentUpdates: () => api.get('/colleges/student-updates'),
  submitStudentVerification: (data) => api.post('/colleges/student-verification', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  myStudentVerification: () => api.get('/colleges/student-verification/my'),
  pendingStudents: () => api.get('/colleges/student-requests'),
  decideStudent: (id, data) => api.put(`/colleges/student-requests/${id}/decision`, data),
  createAnnouncement: (data) => api.post('/colleges/announcements', data),
  createEvent: (data) => api.post('/colleges/events', data),
  adminPendingColleges: () => api.get('/colleges/admin/pending'),
  adminDecideCollege: (id, data) => api.put(`/colleges/admin/${id}/decision`, data),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll:           (params) => api.get('/users', { params }),
  getById:          (id)     => api.get(`/users/${id}`),
  update:           (id, data) => api.put(`/users/${id}`, data),
  updateCodingStats:(id, data) => api.put(`/users/${id}/coding-stats`, data),
  importLeetCode:   (id, username) => api.put(`/users/${id}/import/leetcode`, { username }),
  importGitHub:     (id, username) => api.put(`/users/${id}/import/github`, { username }),
  addCertification: (id, data) => api.post(`/users/${id}/certifications`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteCertification: (id, certificationId) => api.delete(`/users/${id}/certifications/${certificationId}`),
  addShowcaseItem:  (id, data) => api.post(`/users/${id}/showcase`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteShowcaseItem: (id, showcaseId) => api.delete(`/users/${id}/showcase/${showcaseId}`),
  searchBySkill:    (params) => api.get('/users/search/skills', { params }),
  delete:           (id)     => api.delete(`/users/${id}`),
};

// ── Skills ────────────────────────────────────────────────────────────────────
export const skillsAPI = {
  getMine:   ()        => api.get('/skills'),
  getByUser: (userId)  => api.get(`/skills/user/${userId}`),
  create:    (data)    => api.post('/skills', data),
  update:    (id, data)=> api.put(`/skills/${id}`, data),
  delete:    (id)      => api.delete(`/skills/${id}`),
};

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goalsAPI = {
  getMine:         (params)           => api.get('/goals', { params }),
  getByUser:       (userId)           => api.get(`/goals/user/${userId}`),
  create:          (data)             => api.post('/goals', data),
  update:          (id, data)         => api.put(`/goals/${id}`, data),
  delete:          (id)               => api.delete(`/goals/${id}`),
  toggleMilestone: (id, milestoneId)  => api.put(`/goals/${id}/milestones/${milestoneId}/toggle`),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getMine:   ()         => api.get('/projects'),
  getByUser: (userId)   => api.get(`/projects/user/${userId}`),
  create:    (data)     => api.post('/projects', data),
  update:    (id, data) => api.put(`/projects/${id}`, data),
  delete:    (id)       => api.delete(`/projects/${id}`),
  like:      (id)       => api.post(`/projects/${id}/like`),
};

// ── Opportunities ─────────────────────────────────────────────────────────────
export const opportunitiesAPI = {
  getAll:           (params)   => api.get('/opportunities', { params }),
  getById:          (id)       => api.get(`/opportunities/${id}`),
  create:           (data)     => api.post('/opportunities', data),
  update:           (id, data) => api.put(`/opportunities/${id}`, data),
  delete:           (id)       => api.delete(`/opportunities/${id}`),
  apply:            (id)       => api.post(`/opportunities/${id}/apply`),
  getMatchedStudents:(id)      => api.get(`/opportunities/${id}/matched-students`),
};

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const leaderboardAPI = {
  get:           (params) => api.get('/leaderboard', { params }),
  deptSummary:   ()       => api.get('/leaderboard/department-summary'),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  overview:           ()       => api.get('/analytics/overview'),
  skillsDistribution: ()       => api.get('/analytics/skills-distribution'),
  aspirations:        (params) => api.get('/analytics/aspirations', { params }),
  codingActivity:     (params) => api.get('/analytics/coding-activity', { params }),
  placementReadiness: ()       => api.get('/analytics/placement-readiness'),
  myStats:            ()       => api.get('/analytics/my-stats'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:      (params) => api.get('/notifications', { params }),
  markRead:    (id)     => api.put(`/notifications/${id}/read`),
  markAllRead: ()       => api.put('/notifications/mark-all-read'),
  delete:      (id)     => api.delete(`/notifications/${id}`),
  broadcast:   (data)   => api.post('/notifications/broadcast', data),
};

// ── Achievements ──────────────────────────────────────────────────────────────
export const achievementsAPI = {
  getAll:      ()       => api.get('/achievements'),
  getMine:     ()       => api.get('/achievements/my'),
  getByUser:   (userId) => api.get(`/achievements/user/${userId}`),
};

// ── Career recommendations ────────────────────────────────────────────────────
export const recommendationsAPI = {
  getProfile:        ()       => api.get('/recommendations/profile'),
  saveProfile:       (data)   => api.put('/recommendations/profile', data),
  generate:          ()       => api.post('/recommendations/generate'),
  getLatest:         ()       => api.get('/recommendations/latest'),
  getHistory:        (params) => api.get('/recommendations/history', { params }),
  getById:           (id)     => api.get(`/recommendations/${id}`),
  getDashboardSummary: ()     => api.get('/recommendations/dashboard-summary'),
};

export default api;
