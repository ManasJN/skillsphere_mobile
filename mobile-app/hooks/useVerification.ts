/**
 * hooks/useVerification.ts
 *
 * Memoized hook that derives verification signals from a User object.
 *
 * Deliberately thin — all logic lives in lib/verification.ts so it
 * can be tested and reused outside React. This hook is just the
 * React binding layer.
 *
 * Why useMemo and not useEffect+useState:
 *  - Verification is a pure derivation of User data, not async work.
 *  - useMemo re-derives synchronously when `user` identity changes,
 *    with no intermediate loading flash.
 *  - If we add async verification checks later (e.g. a server ping),
 *    we'd add a separate `useEffect` alongside this memo, not replace it.
 */

import { useMemo } from 'react';

import {
  countVerified,
  deriveVerifications,
  hasAnyVerification,
  type VerificationSignal,
} from '@/lib/verification';
import type { User } from '@/hooks/useUser';

type UseVerificationReturn = {
  signals:         VerificationSignal[];
  verifiedCount:   number;
  hasVerification: boolean;
  /** Signals where status === 'verified' only — for compact display */
  verifiedSignals: VerificationSignal[];
};

export function useVerification(user: User | null): UseVerificationReturn {
  return useMemo(() => {
    const signals         = deriveVerifications(user);
    const verifiedCount   = countVerified(signals);
    const hasVerification = hasAnyVerification(signals);
    const verifiedSignals = signals.filter(s => s.status === 'verified');

    return { signals, verifiedCount, hasVerification, verifiedSignals };
  }, [
    // Depend on the specific fields that drive derivation,
    // not the whole user object — avoids spurious re-derives.
    user?.verificationStatus,
    user?.platformProfiles?.github,
    user?.socialLinks?.linkedin,
    (user as any)?.linkedinUrl,
    (user as any)?.certificates?.length,
  ]);
}
