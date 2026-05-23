/**
 * useGoals — single source of truth for all goal state.
 *
 * Every screen that reads or mutates goals goes through this hook.
 * No screen calls goalsAPI directly.
 *
 * Design notes:
 *  - Optimistic updates on complete/delete so the UI feels instant
 *  - All mutations return the updated goal so callers can react
 *  - XP is awarded server-side; we just refetch user XP after mutations
 *    that could change it (complete, milestone toggle)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { goalsAPI } from '@/lib/api';

// ─── Shared Goal type (used across all screens) ───────────────────────────────

export type Milestone = {
  _id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
};

export type Goal = {
  _id: string;
  title: string;
  description?: string;
  type: 'monthly' | 'semester' | 'yearly' | 'custom';
  category: 'Coding' | 'Academic' | 'Project' | 'Skill' | 'Career' | 'Health' | 'Other';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  progress: number;           // 0-100
  targetValue?: number;       // e.g. 300 (problems to solve)
  currentValue?: number;
  unit?: string;              // e.g. "problems", "commits"
  deadline: string;           // ISO date string
  completedAt?: string;
  milestones: Milestone[];
  xpReward: number;
  isPublic?: boolean;
  createdAt: string;
};

export type GoalDraft = {
  title: string;
  description?: string;
  type: Goal['type'];
  category: Goal['category'];
  priority: Goal['priority'];
  deadline: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  milestones?: { title: string }[];
  xpReward?: number;
};

// ─── XP reward lookup (mirrors what the backend would set as defaults) ────────
// Used only to show the user what they'll earn before creating — server is authoritative.

export const XP_REWARDS: Record<Goal['type'], number> = {
  monthly:  100,
  semester: 300,
  yearly:   500,
  custom:   150,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

type FilterStatus = 'active' | 'completed' | 'paused' | 'all';

export function useGoals(filterStatus: FilterStatus = 'active') {
  const [goals,     setGoals]     = useState<Goal[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const hasFetched  = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setError('');
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await goalsAPI.getMine(params);
      setGoals(res.data.data ?? []);
    } catch {
      setError('Could not load goals.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (!hasFetched.current) { hasFetched.current = true; }
    setLoading(true);
    load();
  }, [load]);

  // ── Create ────────────────────────────────────────────────────────────────

  const create = async (draft: GoalDraft): Promise<Goal> => {
    const payload = {
      ...draft,
      xpReward: draft.xpReward ?? XP_REWARDS[draft.type],
    };
    const res = await goalsAPI.create(payload as Record<string, unknown>);
    const created: Goal = res.data.data;
    // Prepend so it appears at top immediately
    setGoals(prev => [created, ...prev]);
    return created;
  };

  // ── Update ────────────────────────────────────────────────────────────────

  const update = async (id: string, changes: Partial<GoalDraft & { progress: number; status: Goal['status']; currentValue: number }>): Promise<Goal> => {
    const res = await goalsAPI.update(id, changes as Record<string, unknown>);
    const updated: Goal = res.data.data;
    setGoals(prev => prev.map(g => g._id === id ? updated : g));
    return updated;
  };

  // ── Mark complete (optimistic) ────────────────────────────────────────────

  const complete = async (id: string): Promise<Goal> => {
    // Optimistic update first — feels instant
    setGoals(prev => prev.map(g =>
      g._id === id
        ? { ...g, progress: 100, status: 'completed', completedAt: new Date().toISOString() }
        : g
    ));
    try {
      const res = await goalsAPI.update(id, { progress: 100, status: 'completed' });
      const updated: Goal = res.data.data;
      setGoals(prev => prev.map(g => g._id === id ? updated : g));
      return updated;
    } catch (e) {
      // Rollback on failure
      load(true);
      throw e;
    }
  };

  // ── Delete (optimistic) ───────────────────────────────────────────────────

  const remove = async (id: string): Promise<void> => {
    // Optimistic remove
    setGoals(prev => prev.filter(g => g._id !== id));
    try {
      await goalsAPI.delete(id);
    } catch {
      // Rollback
      load(true);
      throw new Error('Could not delete goal. Please try again.');
    }
  };

  // ── Toggle milestone (optimistic) ────────────────────────────────────────

  const toggleMilestone = async (goalId: string, milestoneId: string): Promise<void> => {
    // Optimistic toggle
    setGoals(prev => prev.map(g => {
      if (g._id !== goalId) return g;
      const milestones = g.milestones.map(m =>
        m._id === milestoneId
          ? { ...m, isCompleted: !m.isCompleted, completedAt: !m.isCompleted ? new Date().toISOString() : undefined }
          : m
      );
      const done  = milestones.filter(m => m.isCompleted).length;
      const total = milestones.length;
      const progress = total > 0 ? Math.round((done / total) * 100) : g.progress;
      return { ...g, milestones, progress };
    }));

    try {
      const res = await goalsAPI.toggleMilestone(goalId, milestoneId);
      const updated: Goal = res.data.data;
      setGoals(prev => prev.map(g => g._id === goalId ? updated : g));
    } catch {
      load(true);
    }
  };

  // ── Update progress value ─────────────────────────────────────────────────

  const updateProgress = async (id: string, currentValue: number): Promise<void> => {
    await update(id, { currentValue });
  };

  // ── Derived stats (used by Goals tab header) ──────────────────────────────

  const stats = {
    total:     goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    active:    goals.filter(g => g.status === 'active').length,
    overdue:   goals.filter(g =>
      g.status === 'active' && new Date(g.deadline) < new Date()
    ).length,
  };

  return {
    goals,
    loading,
    error,
    refetch: () => load(),
    create,
    update,
    complete,
    remove,
    toggleMilestone,
    updateProgress,
    stats,
  };
}
