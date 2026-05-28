/**
 * lib/timeline.ts
 *
 * Types, category metadata, and pure utility functions for the
 * achievement timeline. Keeps all data concerns separate from UI.
 *
 * Designed for future extensibility:
 *  - Backend persistence: swap the AsyncStorage calls in useTimeline
 *    for API calls with zero changes here
 *  - Portfolio mode: export filteredEntries() with isPublic flag
 *  - Resume export: entries are structured for easy serialisation
 */

// ─── Category definition ──────────────────────────────────────────────────────

export type TimelineCategory =
  | 'project'
  | 'hackathon'
  | 'certification'
  | 'internship'
  | 'workshop'
  | 'achievement';

/** Visual config per category. Colors reference the design system palette. */
export const CATEGORY_CONFIG: Record<
  TimelineCategory,
  { label: string; color: string; icon: string }
> = {
  project:       { label: 'Project',       color: '#8AB4F8', icon: 'code-slash-outline'   },
  hackathon:     { label: 'Hackathon',     color: '#A6A1D8', icon: 'flash-outline'        },
  certification: { label: 'Certification', color: '#78C690', icon: 'ribbon-outline'       },
  internship:    { label: 'Internship',    color: '#D0A06A', icon: 'briefcase-outline'    },
  workshop:      { label: 'Workshop',      color: '#C793B7', icon: 'school-outline'       },
  achievement:   { label: 'Achievement',   color: '#7BC798', icon: 'trophy-outline'       },
} as const;

export const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG) as TimelineCategory[];

// ─── Entry type ───────────────────────────────────────────────────────────────

export type TimelineEntry = {
  /** Client-generated UUID — stable across edits */
  id:          string;
  category:    TimelineCategory;
  title:       string;
  /** Optional organisation, company, or platform name */
  organisation?: string;
  description?: string;
  /** ISO date string — used for sorting. Display formatted separately. */
  date:        string;
  /** Optional end date — for ranges like internship tenure */
  endDate?:    string;
  /** Free-form tags, e.g. ['React Native', 'TypeScript'] */
  tags?:       string[];
  /** Future portfolio mode: controls public visibility */
  isPublic?:   boolean;
  /** ISO timestamp of when this entry was created */
  createdAt:   string;
};

// ─── Draft type (for create/edit form) ───────────────────────────────────────

export type TimelineEntryDraft = Omit<TimelineEntry, 'id' | 'createdAt'>;

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Sort entries newest-first by date. Pure — does not mutate. */
export function sortByDate(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/** Sort entries oldest-first (for career timeline / portfolio view). */
export function sortByDateAsc(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/** Filter to a single category. */
export function filterByCategory(
  entries: TimelineEntry[],
  category: TimelineCategory | 'all'
): TimelineEntry[] {
  if (category === 'all') return entries;
  return entries.filter(e => e.category === category);
}

/**
 * Format date for display.
 * Single date → "Mar 2024"
 * Date range → "Jun 2024 – Aug 2024"
 */
export function formatTimelineDate(date: string, endDate?: string): string {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
      new Date(d)
    );
  if (endDate) return `${fmt(date)} – ${fmt(endDate)}`;
  return fmt(date);
}

/** Parse a display string like "Mar 2024" back to an ISO date for storage. */
export function parseMonthYear(value: string): string | null {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Generate a lightweight unique ID without external dependencies. */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
