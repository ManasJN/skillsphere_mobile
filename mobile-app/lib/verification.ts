/**
 * lib/verification.ts
 *
 * Pure types, config, and a derivation function for the verification system.
 * No side effects, no React, no imports from outside this module.
 *
 * Design decisions:
 *  - Verification state is DERIVED from existing User data, not a separate
 *    API call. This means it works immediately with no new backend work.
 *  - When the backend adds dedicated verification endpoints, swap only the
 *    `deriveVerifications` function — all UI stays unchanged.
 *  - Four kinds now; the config table makes adding a fifth trivial.
 *
 * Future backend extensibility:
 *  - Add `verifications: VerificationRecord[]` to the User type returned
 *    from /auth/me, then replace `deriveVerifications` with a mapper that
 *    reads that field.
 *  - The `VerificationStatus` union and all component props are forward-
 *    compatible with a server-issued timestamp and verifier string.
 *
 * Portfolio mode reuse:
 *  - Call `deriveVerifications(user)` in the portfolio data layer.
 *  - Filter to `status === 'verified'` and render `VerificationBadge`
 *    components inline next to the user's name or in a trust strip.
 */

import type { User } from '@/hooks/useUser';

// ─── Kinds ────────────────────────────────────────────────────────────────────

export type VerificationKind =
  | 'email'
  | 'github'
  | 'linkedin'
  | 'certificate';

// ─── Status ───────────────────────────────────────────────────────────────────

/**
 * Three-state model:
 *  - verified   → signal confirmed (green checkmark treatment)
 *  - pending    → connected but not yet confirmed by backend
 *  - unverified → no signal at all (rendered as muted/absent)
 *
 * We intentionally do NOT use a boolean so future states (e.g. 'expired',
 * 'revoked') can be added without breaking existing UI logic.
 */
export type VerificationStatus = 'verified' | 'pending' | 'unverified';

// ─── Single verification signal ───────────────────────────────────────────────

export type VerificationSignal = {
  kind:        VerificationKind;
  status:      VerificationStatus;
  /** Short label shown in details sheet, e.g. "GitHub connected" */
  label:       string;
  /** One-line explanation shown in the details sheet */
  description: string;
  /** Optional: what the user connected (e.g. github username, email address) */
  value?:      string;
  /** ISO timestamp when verified — future backend field */
  verifiedAt?: string;
};

// ─── Config per kind (icons, colors, copy) ────────────────────────────────────

type KindConfig = {
  /** Ionicons name */
  icon:         string;
  iconVerified: string;
  /** Muted accent — not a bright social-media color */
  color:        string;
  /** Short label for badge tooltip */
  shortLabel:   string;
  description:  string;
};

export const VERIFICATION_CONFIG: Record<VerificationKind, KindConfig> = {
  email: {
    icon:         'mail-outline',
    iconVerified: 'mail',
    color:        '#78C690',   // success green — restrained
    shortLabel:   'Email verified',
    description:  'Your .edu email address has been confirmed.',
  },
  github: {
    icon:         'code-slash-outline',
    iconVerified: 'code-slash',
    color:        '#8B949E',   // GitHub muted — matches GitHubCard
    shortLabel:   'GitHub connected',
    description:  'A public GitHub profile is linked to this account.',
  },
  linkedin: {
    icon:         'briefcase-outline',
    iconVerified: 'briefcase',
    color:        '#7BA7C8',   // muted LinkedIn blue, not the bright #0A66C2
    shortLabel:   'LinkedIn linked',
    description:  'A LinkedIn profile URL has been added.',
  },
  certificate: {
    icon:         'ribbon-outline',
    iconVerified: 'ribbon',
    color:        '#C8A97A',   // muted amber — not trophy-yellow
    shortLabel:   'Certificate verified',
    description:  'At least one uploaded certificate has been reviewed.',
  },
} as const;

// ─── Derivation ───────────────────────────────────────────────────────────────

/**
 * Derives the current set of verification signals from a User object.
 *
 * All logic is deterministic and pure — safe to memoize with useMemo.
 *
 * Derivation rules (current, frontend-only):
 *  - email:       user.verificationStatus === 'verified'
 *  - github:      user.platformProfiles?.github is non-empty
 *  - linkedin:    user.socialLinks?.linkedin is non-empty
 *  - certificate: user.certificates?.length > 0 (future field, graceful)
 *
 * When the backend provides a richer verification object, replace only
 * this function.
 */
export function deriveVerifications(user: User | null): VerificationSignal[] {
  if (!user) return getDefaultSignals();

  return [
    {
      kind:        'email',
      status:      user.verificationStatus === 'verified' ? 'verified' : 'unverified',
      label:       VERIFICATION_CONFIG.email.shortLabel,
      description: VERIFICATION_CONFIG.email.description,
      value:       user.verificationStatus === 'verified' ? user.email : undefined,
    },
    {
      kind:        'github',
      status:      user.platformProfiles?.github ? 'verified' : 'unverified',
      label:       VERIFICATION_CONFIG.github.shortLabel,
      description: VERIFICATION_CONFIG.github.description,
      value:       user.platformProfiles?.github
        ? `github.com/${user.platformProfiles.github}`
        : undefined,
    },
    {
      kind:        'linkedin',
      status:      (user.socialLinks?.linkedin || (user as any).linkedinUrl)
        ? 'verified'
        : 'unverified',
      label:       VERIFICATION_CONFIG.linkedin.shortLabel,
      description: VERIFICATION_CONFIG.linkedin.description,
      value:       user.socialLinks?.linkedin ?? (user as any).linkedinUrl ?? undefined,
    },
    {
      kind:        'certificate',
      status:      ((user as any).certificates?.length ?? 0) > 0 ? 'verified' : 'unverified',
      label:       VERIFICATION_CONFIG.certificate.shortLabel,
      description: VERIFICATION_CONFIG.certificate.description,
      value:       ((user as any).certificates?.length ?? 0) > 0
        ? `${(user as any).certificates.length} certificate${(user as any).certificates.length > 1 ? 's' : ''}`
        : undefined,
    },
  ];
}

/** Returns all four signals as unverified — used before user data loads. */
function getDefaultSignals(): VerificationSignal[] {
  return (Object.keys(VERIFICATION_CONFIG) as VerificationKind[]).map(kind => ({
    kind,
    status:      'unverified' as const,
    label:       VERIFICATION_CONFIG[kind].shortLabel,
    description: VERIFICATION_CONFIG[kind].description,
  }));
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Count of verified signals — used for trust score / summary line. */
export function countVerified(signals: VerificationSignal[]): number {
  return signals.filter(s => s.status === 'verified').length;
}

/** Returns true if at least one signal is verified. */
export function hasAnyVerification(signals: VerificationSignal[]): boolean {
  return signals.some(s => s.status === 'verified');
}
