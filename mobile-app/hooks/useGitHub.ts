/**
 * hooks/useGitHub.ts
 *
 * Manages the complete GitHub integration lifecycle:
 *   - Tracks the username input locally
 *   - Fetches the public profile via lib/github.ts
 *   - Persists the username to the backend via usersAPI
 *   - Surfaces distinct loading states for fetch vs save
 *
 * Deliberately NOT auto-fetching on mount — only fetches on explicit
 * user action to conserve the 60 req/hour unauthenticated rate limit.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { usersAPI } from '@/lib/api';
import {
  clearGitHubCache,
  fetchGitHubProfile,
  validateGitHubUsername,
  type GitHubErrorCode,
  type GitHubProfile,
} from '@/lib/github';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GitHubState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; profile: GitHubProfile }
  | { status: 'error'; code: GitHubErrorCode; message: string };

type UseGitHubOptions = {
  userId: string;
  /** Saved username from the backend (user.platformProfiles.github) */
  savedUsername?: string;
  /** Called after username is successfully persisted to backend */
  onSaved?: (username: string) => void;
};

type UseGitHubReturn = {
  username:      string;
  setUsername:   (v: string) => void;
  state:         GitHubState;
  validationError: string | null;
  isSaving:      boolean;
  /** Preview the profile without saving */
  preview:       () => Promise<void>;
  /** Save username to backend, then fetch profile */
  save:          () => Promise<void>;
  /** Clear the current result and reset to idle */
  reset:         () => void;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGitHub({
  userId,
  savedUsername = '',
  onSaved,
}: UseGitHubOptions): UseGitHubReturn {
  const [username, setUsernameRaw] = useState(savedUsername);
  const [state,    setState]       = useState<GitHubState>({ status: 'idle' });
  const [isSaving, setIsSaving]    = useState(false);
  const mountedRef = useRef(true);

  // If the parent re-renders with a new savedUsername (e.g. after data loads),
  // sync local state — but only if the user hasn't started typing.
  useEffect(() => {
    setUsernameRaw((prev: string) => (prev === '' || prev === savedUsername) ? savedUsername : prev);
  }, [savedUsername]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Live validation — reactive, no network
  const validationError = validateGitHubUsername(username);

  const setUsername = useCallback((v: string) => {
    setUsernameRaw(v);
    // Clear previous result when user starts editing
    setState((prev: GitHubState) => prev.status === 'idle' ? prev : { status: 'idle' });
  }, []);

  /** Fetch profile from GitHub API for preview (no backend save) */
  const preview = useCallback(async () => {
    const u = username.trim();
    if (!u || validationError) return;

    setState({ status: 'loading' });
    const result = await fetchGitHubProfile(u);

    if (!mountedRef.current) return;

    if (result.ok) {
      setState({ status: 'success', profile: result.profile });
    } else {
      setState({ status: 'error', code: result.code, message: result.message });
    }
  }, [username, validationError]);

  /**
   * Save the username to the backend, then display the profile.
   * Two-step: persist first, then fetch fresh from GitHub.
   * If the backend save fails, we still preview — username is already
   * validated and the profile display is harmless without persistence.
   */
  const save = useCallback(async () => {
    const u = username.trim();
    if (!u || validationError) return;

    setIsSaving(true);
    setState({ status: 'loading' });

    try {
      // Persist to backend — non-blocking if it fails
      await usersAPI.update(userId, {
        platformProfiles: { github: u },
      });
      if (mountedRef.current) onSaved?.(u);
    } catch (err) {
      // Backend save failed — log in dev but don't block the preview
      if (__DEV__) {
        console.warn('[useGitHub] Failed to save username to backend:', err);
      }
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }

    // Fetch profile regardless of backend save result
    clearGitHubCache(u); // force fresh fetch after save
    const result = await fetchGitHubProfile(u);

    if (!mountedRef.current) return;

    if (result.ok) {
      setState({ status: 'success', profile: result.profile });
    } else {
      setState({ status: 'error', code: result.code, message: result.message });
    }
  }, [username, validationError, userId, onSaved]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
    setUsernameRaw(savedUsername);
  }, [savedUsername]);

  return {
    username,
    setUsername,
    state,
    validationError: username.trim() ? validationError : null,
    isSaving,
    preview,
    save,
    reset,
  };
}
