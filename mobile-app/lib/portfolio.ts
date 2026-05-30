/**
 * lib/portfolio.ts
 *
 * Pure types and utilities for the portfolio share system.
 * No React, no side effects — safe to import anywhere.
 *
 * Architecture:
 *   PortfolioData is assembled once from existing store types and
 *   passed to both the preview screen and the share screen. There
 *   is no separate portfolio fetch — it composes from what we already
 *   have: User, Skill[], Project[], TimelineEntry[], VerificationSignal[].
 *
 * Link structure:
 *   Current (Phase 5A):
 *     skillsphere://portfolio/{userId}
 *     https://skillsphere.app/u/{userId}   ← canonical deep-link form
 *
 *   These are "intent URLs" for now — the app intercepts them via
 *   expo-linking deep link config. When backend-hosted public profiles
 *   are implemented, the same URL structure is served as an actual page.
 *
 * Future public portfolio (Phase 5B+):
 *   1. Backend adds GET /users/:id/public endpoint that returns
 *      a sanitised PortfolioData JSON.
 *   2. Web frontend renders the same sections at /u/:username.
 *   3. The QR and share link already point to the right URL.
 *   4. Only `assemblePortfolioData` needs updating to mark fields public.
 */

import type { User } from '@/hooks/useUser';
import type { TimelineEntry } from '@/lib/timeline';
import type { VerificationSignal } from '@/lib/verification';

// ─── Inline skill + project types (avoid importing from profile screen) ───────

export type PortfolioSkill = {
  name:     string;
  category: string;
  level:    number;
};

export type PortfolioProject = {
  title:       string;
  description: string;
  techStack:   string[];
  status:      string;
};

// ─── Core portfolio data object ───────────────────────────────────────────────

export type PortfolioData = {
  /** User identity */
  userId:   string;
  name:     string;
  email:    string;
  role:     string;
  bio?:     string;

  /** Academic */
  department?: string;
  batch?:      string;
  college?:    string;
  aspiration?: string;

  /** XP / level */
  level:     number;
  xpPoints:  number;

  /** Connected platforms */
  githubUsername?: string;
  socialLinks:     Record<string, string>;

  /** Core content */
  skills:    PortfolioSkill[];
  projects:  PortfolioProject[];
  timeline:  TimelineEntry[];

  /** Trust */
  verifications: VerificationSignal[];

  /** Coding stats snapshot */
  codingStats: Record<string, number>;

  /** Metadata */
  generatedAt: string;
};

// ─── Assembly ─────────────────────────────────────────────────────────────────

/**
 * Assembles a PortfolioData snapshot from existing in-memory state.
 * Called once when the user taps "Share Portfolio".
 * Pure — does not mutate input.
 */
export function assemblePortfolioData(
  user:          User,
  skills:        { name?: string; category?: string; level?: number }[],
  projects:      { title?: string; description?: string; techStack?: string[]; status?: string }[],
  timeline:      TimelineEntry[],
  verifications: VerificationSignal[],
): PortfolioData {
  return {
    userId:   user._id ?? '',
    name:     user.name ?? 'Student',
    email:    user.email ?? '',
    role:     user.role ?? 'student',
    bio:      (user as any).bio ?? undefined,

    department: user.department,
    batch:      user.batch,
    college:    user.collegeId?.collegeName ?? user.college,
    aspiration: (user as any).aspiration,

    level:    Math.floor((user.xpPoints ?? 0) / 500) + 1,
    xpPoints: user.xpPoints ?? 0,

    githubUsername: user.platformProfiles?.github,
    socialLinks:    user.socialLinks ?? {},

    skills: skills.map(s => ({
      name:     s.name ?? '',
      category: s.category ?? '',
      level:    s.level ?? 0,
    })).filter(s => s.name),

    projects: projects.map(p => ({
      title:       p.title ?? '',
      description: p.description ?? '',
      techStack:   p.techStack ?? [],
      status:      p.status ?? 'planned',
    })).filter(p => p.title),

    timeline: timeline.filter(e => e.isPublic !== false), // respect public flag

    verifications,

    codingStats: (user.codingStats ?? {}) as Record<string, number>,

    generatedAt: new Date().toISOString(),
  };
}

// ─── Link generation ──────────────────────────────────────────────────────────

/** Base URL for portfolio deep links. */
export const PORTFOLIO_BASE_URL = 'https://skillsphere.app/u';

/**
 * Generates the canonical shareable URL for a portfolio.
 *
 * Phase 5A: Points to a URL that doesn't serve content yet — it's the
 * canonical form that deep-links back into the app on devices that have
 * it installed, and will serve real content when the web frontend exists.
 *
 * Uses userId as the identifier. When backend adds username/slug support,
 * swap to `user.username ?? user._id`.
 */
export function generatePortfolioUrl(userId: string): string {
  if (!userId) return `${PORTFOLIO_BASE_URL}/preview`;
  return `${PORTFOLIO_BASE_URL}/${userId}`;
}

/**
 * Generates the native deep-link URI (skillsphere:// scheme).
 * Used as fallback for QR codes on devices without the browser app.
 */
export function generateDeepLinkUrl(userId: string): string {
  return `skillsphere://portfolio/${userId}`;
}

/**
 * Compose the share message for the native share sheet.
 * Kept terse and professional — not social-media-y.
 */
export function generateShareMessage(data: PortfolioData): string {
  const lines: string[] = [];
  lines.push(`${data.name} — ${data.role}`);
  if (data.college) lines.push(data.college);
  lines.push('');
  lines.push(generatePortfolioUrl(data.userId));
  return lines.join('\n');
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Returns initials for display in portfolio header (1–2 chars). */
export function getPortfolioInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'SS';
  const trimmed = name.trim();
  if (!trimmed) return 'SS';
  return trimmed
    .split(' ')
    .filter(p => p.length > 0)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SS';
}

/** Returns a short summary line for the portfolio header. */
export function getPortfolioHeadline(data: PortfolioData): string {
  const parts: string[] = [];
  if (data.aspiration) return data.aspiration;
  if (data.department) parts.push(data.department);
  if (data.batch) parts.push(data.batch);
  if (data.college) parts.push(data.college);
  return parts.join(' · ') || data.role;
}
