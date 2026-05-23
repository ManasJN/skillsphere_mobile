/**
 * useProductivity — derives actionable signals from already-fetched data.
 *
 * No new API calls. Takes the raw data the dashboard already has and
 * computes what the student actually needs to know:
 *   - Is their streak safe today or at risk?
 *   - How many goals are overdue?
 *   - What is their weekly momentum?
 *   - How close are they to the next XP level?
 *   - What is the single most important thing to act on right now?
 *
 * These signals are used by InsightBar and XPCard.
 * The hook is pure computation — no useState, no effects, no fetches.
 */

import { levelFromXP } from './useUser';

export type Goal = {
  status?: string;
  progress?: number;
  deadline?: string;
  title?: string;
  priority?: string;
};

export type StreakHealth = 'safe' | 'at_risk' | 'new' | 'broken';

export type Insight = {
  kind: 'streak_at_risk' | 'goal_overdue' | 'goal_due_soon' | 'xp_milestone'
      | 'level_up_close' | 'completion_rate' | 'first_goal' | 'first_skill';
  message: string;
  /** Route to navigate on tap — null means no action */
  route: string | null;
  /** Accent color for the left border */
  color: 'accent' | 'warning' | 'danger' | 'success' | 'muted';
};

// ─── Streak health ────────────────────────────────────────────────────────────

/**
 * Determines streak health based on lastActiveAt.
 * The server updates lastActiveAt on each authenticated request,
 * so if the user has opened the app today, it will be < 12h ago.
 */
export function streakHealth(
  streakDays: number,
  lastActiveAt?: string,
): StreakHealth {
  if (streakDays === 0) return 'new';
  if (!lastActiveAt)   return 'safe'; // can't tell — assume safe
  const hoursSinceLast = (Date.now() - new Date(lastActiveAt).getTime()) / 3_600_000;
  if (hoursSinceLast >= 36) return 'broken';  // streak has likely reset
  if (hoursSinceLast >= 18) return 'at_risk'; // hasn't visited today yet
  return 'safe';
}

// ─── XP context ──────────────────────────────────────────────────────────────

export function xpToNextLevel(xp: number): number {
  const level = levelFromXP(xp);
  return level * 500 - xp;
}

export function isCloseToLevelUp(xp: number): boolean {
  return xpToNextLevel(xp) <= 150;
}

// ─── Goal insights ────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

export function overdueGoals(goals: Goal[]): Goal[] {
  return goals.filter(g =>
    g.status === 'active' && daysUntil(g.deadline) !== null && (daysUntil(g.deadline) ?? 1) < 0
  );
}

export function goalsDueSoon(goals: Goal[], withinDays = 3): Goal[] {
  return goals.filter(g => {
    if (g.status !== 'active') return false;
    const d = daysUntil(g.deadline);
    return d !== null && d >= 0 && d <= withinDays;
  });
}

export function goalCompletionRate(goals: Goal[]): number {
  if (goals.length === 0) return 0;
  return Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100);
}

// ─── Single most important insight ───────────────────────────────────────────
// Priority: overdue > streak at risk > due soon > level up close > completion > first_*

export function topInsight(params: {
  xp: number;
  streakDays: number;
  lastActiveAt?: string;
  goals: Goal[];
  hasSkills: boolean;
}): Insight | null {
  const { xp, streakDays, lastActiveAt, goals, hasSkills } = params;

  // New user — no data yet
  if (xp === 0 && goals.length === 0 && !hasSkills) return null;

  // First goal nudge
  if (goals.length === 0) {
    return {
      kind: 'first_goal',
      message: 'Set your first goal to start tracking progress.',
      route: '/(tabs)/goals',
      color: 'accent',
    };
  }

  // Overdue
  const overdue = overdueGoals(goals);
  if (overdue.length > 0) {
    const title = overdue[0].title;
    return {
      kind: 'goal_overdue',
      message: overdue.length === 1
        ? `"${title}" is overdue — update or reschedule it.`
        : `${overdue.length} goals are overdue.`,
      route: '/(tabs)/goals',
      color: 'danger',
    };
  }

  // Streak at risk
  const health = streakHealth(streakDays, lastActiveAt);
  if (health === 'at_risk' && streakDays > 1) {
    return {
      kind: 'streak_at_risk',
      message: `${streakDays}-day streak — you haven't checked in today yet.`,
      route: null,
      color: 'warning',
    };
  }

  // Due soon
  const soon = goalsDueSoon(goals);
  if (soon.length > 0) {
    return {
      kind: 'goal_due_soon',
      message: `"${soon[0].title}" is due within 3 days.`,
      route: '/(tabs)/goals',
      color: 'warning',
    };
  }

  // Close to level up
  if (isCloseToLevelUp(xp)) {
    const needed = xpToNextLevel(xp);
    return {
      kind: 'level_up_close',
      message: `${needed} XP away from Level ${levelFromXP(xp) + 1}.`,
      route: null,
      color: 'accent',
    };
  }

  // Good completion rate
  const rate = goalCompletionRate(goals);
  if (rate >= 70 && goals.filter(g => g.status === 'completed').length >= 3) {
    return {
      kind: 'completion_rate',
      message: `${rate}% goal completion rate — solid progress.`,
      route: '/(tabs)/goals',
      color: 'success',
    };
  }

  return null;
}
