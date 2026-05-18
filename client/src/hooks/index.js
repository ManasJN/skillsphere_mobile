import { useState, useEffect, useCallback, useRef } from 'react';
import { skillsAPI, goalsAPI, projectsAPI, notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

// ── useDebounce ───────────────────────────────────────────────────────────────
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ── useSkills ─────────────────────────────────────────────────────────────────
export const useSkills = (userId = null) => {
  const [skills,  setSkills]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = userId ? await skillsAPI.getByUser(userId) : await skillsAPI.getMine();
      setSkills(res.data.data);
    } catch { toast.error('Failed to load skills'); }
    finally  { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addSkill = async (data) => {
    const res = await skillsAPI.create(data);
    setSkills(p => [res.data.data, ...p]);
    toast.success('Skill added (+50 XP)');
    return res.data.data;
  };

  const updateSkill = async (id, data) => {
    const res = await skillsAPI.update(id, data);
    setSkills(p => p.map(s => s._id === id ? res.data.data : s));
    toast.success('Skill updated!');
    return res.data.data;
  };

  const deleteSkill = async (id) => {
    await skillsAPI.delete(id);
    setSkills(p => p.filter(s => s._id !== id));
    toast.success('Skill removed');
  };

  return { skills, loading, refetch: fetch, addSkill, updateSkill, deleteSkill };
};

// ── useGoals ──────────────────────────────────────────────────────────────────
export const useGoals = (params = {}) => {
  const [goals,   setGoals]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await goalsAPI.getMine(params);
      setGoals(res.data.data);
    } catch { toast.error('Failed to load goals'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addGoal = async (data) => {
    const res = await goalsAPI.create(data);
    setGoals(p => [res.data.data, ...p]);
    toast.success('Goal created (+30 XP)');
    return res.data.data;
  };

  const updateGoal = async (id, data) => {
    const res = await goalsAPI.update(id, data);
    setGoals(p => p.map(g => g._id === id ? res.data.data : g));
    if (res.data.data.status === 'completed') toast.success('Goal completed (+300 XP)');
    else toast.success('Goal updated!');
    return res.data.data;
  };

  const deleteGoal = async (id) => {
    await goalsAPI.delete(id);
    setGoals(p => p.filter(g => g._id !== id));
    toast.success('Goal deleted');
  };

  return { goals, loading, refetch: fetch, addGoal, updateGoal, deleteGoal };
};

// ── useProjects ───────────────────────────────────────────────────────────────
export const useProjects = (userId = null) => {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = userId ? await projectsAPI.getByUser(userId) : await projectsAPI.getMine();
      setProjects(res.data.data);
    } catch { toast.error('Failed to load projects'); }
    finally  { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addProject = async (data) => {
    const res = await projectsAPI.create(data);
    setProjects(p => [res.data.data, ...p]);
    toast.success('Project added (+100 XP)');
    return res.data.data;
  };

  const updateProject = async (id, data) => {
    const res = await projectsAPI.update(id, data);
    setProjects(p => p.map(pr => pr._id === id ? res.data.data : pr));
    if (res.data.data.status === 'completed') toast.success('Project completed (+500 XP)');
    else toast.success('Project updated!');
    return res.data.data;
  };

  const deleteProject = async (id) => {
    await projectsAPI.delete(id);
    setProjects(p => p.filter(pr => pr._id !== id));
    toast.success('Project removed');
  };

  return { projects, loading, refetch: fetch, addProject, updateProject, deleteProject };
};

// ── useNotifications ──────────────────────────────────────────────────────────
export const useNotifications = () => {
  const [notifs,      setNotifs]      = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading,     setLoading]     = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 30 });
      setNotifs(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifs(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifs(p => p.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return { notifs, unreadCount, loading, refetch: fetch, markRead, markAllRead };
};
