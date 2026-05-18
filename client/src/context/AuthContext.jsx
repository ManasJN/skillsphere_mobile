import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('ss_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('ss_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(res => setUser(res.data.data))
      .catch(() => { localStorage.removeItem('ss_token'); localStorage.removeItem('ss_user'); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('ss_token', token);
    localStorage.setItem('ss_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    return res.data;
  }, []);

  const registerCollege = useCallback(async (data) => {
    const res = await authAPI.registerCollege(data);
    return res.data;
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    const res = await authAPI.verifyOtp({ email, otp });
    const { token, user: u } = res.data;
    localStorage.setItem('ss_token', token);
    localStorage.setItem('ss_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('ss_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isStudent = user?.role === 'student';
  const isCollege = user?.role === 'college';
  const isAdmin   = user?.role === 'admin';
  const isStaff   = isCollege || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerCollege, verifyOtp, logout, updateUser, isStudent, isCollege, isAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
