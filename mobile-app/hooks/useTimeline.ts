/**
 * hooks/useTimeline.ts
 *
 * Manages the full lifecycle of timeline entries:
 *   - Load from AsyncStorage (no backend endpoint yet)
 *   - Create / update / delete with optimistic UI
 *   - Sort and category-filter
 *
 * Architecture note — designed for backend migration:
 *   The storage layer is isolated in three small helpers (loadRaw,
 *   saveRaw). To migrate to an API, replace those helpers with
 *   axios calls; all state logic above them stays identical.
 *
 *   Example future swap:
 *     const loadRaw = () => timelineAPI.getMine().then(r => r.data.data);
 *     const saveRaw = (entries) => timelineAPI.replace(entries);
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  filterByCategory,
  generateId,
  sortByDate,
  type TimelineCategory,
  type TimelineEntry,
  type TimelineEntryDraft,
} from '@/lib/timeline';

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'skillsphere_timeline_v1';

// ─── Low-level helpers (swap these for API calls when backend is ready) ───────

async function loadRaw(): Promise<TimelineEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TimelineEntry[];
  } catch {
    return [];
  }
}

async function saveRaw(entries: TimelineEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

type UseTimelineOptions = {
  /** Active category filter, default 'all' */
  categoryFilter?: TimelineCategory | 'all';
};

export function useTimeline({ categoryFilter = 'all' }: UseTimelineOptions = {}) {
  const [entries,   setEntries]  = useState<TimelineEntry[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState('');
  const hasFetched  = useRef(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setError('');
    try {
      const raw = await loadRaw();
      setEntries(sortByDate(raw));
    } catch {
      setError('Could not load timeline.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      load();
    }
  }, [load]);

  // ── Create ─────────────────────────────────────────────────────────────────

  const create = useCallback(async (draft: TimelineEntryDraft): Promise<TimelineEntry> => {
    const entry: TimelineEntry = {
      ...draft,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    // Optimistic: update state first, persist async
    setEntries(prev => sortByDate([entry, ...prev]));
    await saveRaw(sortByDate([entry, ...entries]));
    return entry;
  }, [entries]);

  // ── Update ─────────────────────────────────────────────────────────────────

  const update = useCallback(async (
    id: string,
    changes: Partial<TimelineEntryDraft>
  ): Promise<void> => {
    setEntries(prev => {
      const next = prev.map(e =>
        e.id === id ? { ...e, ...changes } : e
      );
      const sorted = sortByDate(next);
      saveRaw(sorted);       // fire-and-forget
      return sorted;
    });
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const remove = useCallback(async (id: string): Promise<void> => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      saveRaw(next);         // fire-and-forget
      return next;
    });
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = filterByCategory(entries, categoryFilter);

  const stats = {
    total:    entries.length,
    byCategory: Object.fromEntries(
      (['project','hackathon','certification','internship','workshop','achievement'] as TimelineCategory[])
        .map(cat => [cat, entries.filter(e => e.category === cat).length])
    ) as Record<TimelineCategory, number>,
  };

  return {
    entries: filtered,
    allEntries: entries,
    loading,
    error,
    refetch: load,
    create,
    update,
    remove,
    stats,
  };
}
