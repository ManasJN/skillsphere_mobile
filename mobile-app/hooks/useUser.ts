import { useCallback, useEffect, useRef, useState } from 'react';
import { authAPI } from '@/lib/api';

export type User = {
  _id?: string; name?: string; email?: string; role?: string;
  department?: string; semester?: number | string; rollNumber?: string;
  cgpa?: number | string; xpPoints?: number; level?: number;
  streakDays?: number; batch?: string; verificationStatus?: string;
  college?: string; collegeId?: { collegeName?: string }; section?: string;
  aspiration?: string; bio?: string; phone?: string;
  codingStats?: Record<string, number>; socialLinks?: Record<string, string>;
  platformProfiles?: Record<string, string> & { github?: string };
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);

  const fetch = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.me();
      setUser(res.data.user ?? res.data.data ?? res.data);
    } catch {
      setError('Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) { hasFetched.current = true; fetch(); }
  }, [fetch]);

  return { user, loading, error, refetch: fetch, setUser };
}

// Maths helpers exported for reuse
export function levelFromXP(xp: number) { return Math.floor(xp / 500) + 1; }
export function xpProgress(xp: number) {
  const lv = levelFromXP(xp);
  return Math.round(((xp - (lv - 1) * 500) / 500) * 100);
}
export function getInitials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'SS';
}
