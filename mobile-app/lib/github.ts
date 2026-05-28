/**
 * lib/github.ts — GitHub REST API service
 *
 * Uses the public GitHub REST API v3 (no auth token required for public data).
 * Docs: https://docs.github.com/en/rest/users/users#get-a-user
 *
 * RATE LIMITS (unauthenticated):
 *   - 60 requests/hour per IP address
 *   - Since this is a mobile app, each user shares their IP's quota
 *   - We mitigate this by:
 *     (a) Only fetching on explicit user action (not on mount)
 *     (b) Caching the last-fetched result in memory for the session
 *     (c) Surfacing rate-limit errors with a clear, actionable message
 *     (d) Never polling or auto-refreshing in the background
 *
 * Authenticated tokens would raise the limit to 5000/hour, but storing
 * a GitHub PAT on-device creates a security surface — not worth it for
 * public profile data. The backend's /users/:id/import/github route uses
 * a server-side token (safer); we use the client-side API only for the
 * live preview before the user saves their username.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Public fields from GET /users/:username */
export type GitHubProfile = {
  login:        string;
  name:         string | null;
  bio:          string | null;
  avatar_url:   string;
  html_url:     string;
  public_repos: number;
  followers:    number;
  following:    number;
  company:      string | null;
  location:     string | null;
  blog:         string | null;
  twitter_username: string | null;
  created_at:   string;
};

/** Discriminated result so callers never need to check for undefined */
export type GitHubResult =
  | { ok: true;  profile: GitHubProfile }
  | { ok: false; code: GitHubErrorCode; message: string };

export type GitHubErrorCode =
  | 'not_found'       // 404 — username doesn't exist
  | 'rate_limited'    // 403/429 — hit 60 req/hour limit
  | 'invalid_username'// failed local validation before fetch
  | 'network_error'   // fetch failed entirely
  | 'unknown';        // any other non-200

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * GitHub username rules:
 *  - 1–39 characters
 *  - Alphanumeric + hyphens
 *  - Cannot start or end with a hyphen
 *  - No consecutive hyphens
 */
const VALID_USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$|^[a-zA-Z0-9]$/;

export function validateGitHubUsername(username: string): string | null {
  const u = username.trim();
  if (!u)           return 'Enter a GitHub username.';
  if (u.length > 39) return 'Username must be 39 characters or fewer.';
  if (!VALID_USERNAME.test(u)) return 'Invalid GitHub username format.';
  return null; // valid
}

// ─── In-memory cache (session-scoped) ────────────────────────────────────────

type CacheEntry = { profile: GitHubProfile; fetchedAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(username: string): GitHubProfile | null {
  const entry = cache.get(username.toLowerCase());
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    cache.delete(username.toLowerCase());
    return null;
  }
  return entry.profile;
}

function setCached(username: string, profile: GitHubProfile): void {
  cache.set(username.toLowerCase(), { profile, fetchedAt: Date.now() });
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

const GITHUB_API = 'https://api.github.com';

/**
 * Fetches public GitHub profile for a given username.
 *
 * - Validates username format before hitting the network
 * - Returns a cache hit if the same username was fetched within 5 minutes
 * - Classifies HTTP errors into actionable codes
 * - Never throws — always returns a GitHubResult
 */
export async function fetchGitHubProfile(username: string): Promise<GitHubResult> {
  const u = username.trim();

  // 1. Validate locally first — saves a network round-trip
  const validationError = validateGitHubUsername(u);
  if (validationError) {
    return { ok: false, code: 'invalid_username', message: validationError };
  }

  // 2. Check session cache
  const cached = getCached(u);
  if (cached) {
    return { ok: true, profile: cached };
  }

  // 3. Fetch from GitHub
  try {
    const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(u)}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (res.ok) {
      const profile: GitHubProfile = await res.json();
      setCached(u, profile);
      return { ok: true, profile };
    }

    // Classify non-2xx responses
    if (res.status === 404) {
      return {
        ok: false,
        code: 'not_found',
        message: `No GitHub user found for "${u}". Check the username and try again.`,
      };
    }

    if (res.status === 403 || res.status === 429) {
      // GitHub sends 403 with X-RateLimit-Remaining: 0 when unauthenticated quota is exceeded
      const remaining = res.headers.get('X-RateLimit-Remaining');
      const reset     = res.headers.get('X-RateLimit-Reset');
      const resetMin  = reset
        ? Math.ceil((parseInt(reset, 10) * 1000 - Date.now()) / 60000)
        : null;

      return {
        ok: false,
        code: 'rate_limited',
        message: remaining === '0'
          ? `GitHub API rate limit reached${resetMin ? ` — resets in ~${resetMin}m` : ''}. Try again shortly.`
          : 'GitHub API temporarily unavailable. Please try again in a moment.',
      };
    }

    return {
      ok: false,
      code: 'unknown',
      message: `GitHub returned an unexpected error (HTTP ${res.status}). Try again.`,
    };
  } catch (err) {
    // Network failure, DNS error, or timeout
    return {
      ok: false,
      code: 'network_error',
      message: 'Could not reach GitHub. Check your internet connection and try again.',
    };
  }
}

/** Clears the session cache for a specific username (e.g. after save). */
export function clearGitHubCache(username?: string): void {
  if (username) {
    cache.delete(username.toLowerCase());
  } else {
    cache.clear();
  }
}
