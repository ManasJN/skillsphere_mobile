/**
 * lib/faculty.ts — Faculty API helpers + shared types
 *
 * Phase 1: read-only visibility into students.
 * Phase 2: opportunity posting, announcement creation.
 * Phase 3: approval flow.
 *
 * All API calls reuse the central `api` axios instance from api.ts,
 * which already attaches JWT and handles 401 redirects.
 */

import api from './api';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type FacultyStudent = {
  _id: string;
  name: string;
  email: string;
  department?: string;
  semester?: number | string;
  rollNumber?: string;
  xpPoints?: number;
  level?: number;
  verificationStatus?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  codingStats?: {
    leetcodeSolved?: number;
    githubRepos?: number;
    githubContributions?: number;
  };
  college?: string;
  batch?: string;
};

export type FacultyStats = {
  totalStudents: number;
  verifiedStudents: number;
  activeThisWeek: number;
  avgXP: number;
  topDepartments: { name: string; count: number }[];
};

export type Announcement = {
  _id: string;
  title: string;
  body: string;
  author: { name: string; _id: string };
  targetRole?: 'student' | 'all';
  createdAt: string;
  pinned?: boolean;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const facultyAPI = {
  /**
   * GET /api/faculty/students
   * Returns all students visible to this college account.
   * Requires role=faculty.
   */
  getStudents: (params?: Record<string, string>) =>
    api.get('/faculty/students', { params }),

  /**
   * GET /api/faculty/students/:id
   * Full student profile for portfolio view.
   */
  getStudent: (id: string) => api.get(`/faculty/students/${id}`),

  /**
   * GET /api/faculty/stats
   * Aggregate stats for the faculty dashboard.
   */
  getStats: () => api.get('/faculty/stats'),

  /**
   * GET /api/faculty/announcements
   * All announcements posted by this college.
   */
  getAnnouncements: () => api.get('/faculty/announcements'),

  /**
   * POST /api/faculty/announcements (Phase 2)
   * Create a new announcement.
   */
  createAnnouncement: (data: { title: string; body: string; pinned?: boolean }) =>
    api.post('/faculty/announcements', data),
};
