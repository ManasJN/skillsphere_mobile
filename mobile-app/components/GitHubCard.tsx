/**
 * components/GitHubCard.tsx
 *
 * Self-contained GitHub profile section for the Profile screen.
 *
 * Three visual states:
 *   1. Input state   — username field + "Connect" button (idle / error)
 *   2. Loading state — skeleton while fetching
 *   3. Profile state — compact developer identity card (success)
 *
 * Design principles:
 *   - Typography-led, not icon-heavy
 *   - Single neutral accent for GitHub (not bright green everywhere)
 *   - Stats inline as text rows, not a grid of boxes
 *   - Avatar via expo-image for smooth loading/fade
 *   - Respects the existing dark theme tokens exactly
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useFadeSlideIn, usePressScale } from '@/hooks/useAnimations';
import { useGitHub } from '@/hooks/useGitHub';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import type { GitHubProfile } from '@/lib/github';
import { Row, Skeleton } from '@/components/ui';

// ─── GitHub neutral accent — subdued, not the loud #2DBA4E green ─────────────
const GH_COLOR = '#8B949E'; // GitHub's own muted text color in dark mode

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  userId: string;
  savedUsername?: string;
  /** Called when a username is successfully saved to backend */
  onUsernameSaved?: (username: string) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function GitHubCard({ userId, savedUsername, onUsernameSaved }: Props) {
  const {
    username,
    setUsername,
    state,
    validationError,
    isSaving,
    preview,
    save,
    reset,
  } = useGitHub({
    userId,
    savedUsername,
    onSaved: onUsernameSaved,
  });

  // Auto-preview when a saved username exists and we haven't fetched yet
  // This runs once when the component mounts with a known username
  const hasSaved     = !!savedUsername;
  const isIdle       = state.status === 'idle';
  const isLoading    = state.status === 'loading';
  const isSuccess    = state.status === 'success';
  const isError      = state.status === 'error';

  // Determine the button action: if username matches saved, just preview;
  // if it's a new/edited username, save to backend too.
  const isNewUsername = username.trim() !== (savedUsername ?? '').trim();
  const handleConnect = useCallback(() => {
    if (isNewUsername || !hasSaved) {
      save();
    } else {
      preview();
    }
  }, [isNewUsername, hasSaved, save, preview]);

  const { scale: btnScale, onPressIn: btnIn, onPressOut: btnOut } = usePressScale(0.96);
  const { scale: linkScale, onPressIn: linkIn, onPressOut: linkOut } = usePressScale(0.97);

  return (
    <View style={S.root}>
      {/* Section header */}
      <Row style={S.sectionHead}>
        <View style={[S.ghDot]} />
        <Text style={S.sectionTitle}>GitHub</Text>
        {isSuccess && (
          <Pressable
            onPress={reset}
            onPressIn={linkIn}
            onPressOut={linkOut}
            hitSlop={10}>
            <Animated.View style={{ transform: [{ scale: linkScale }] }}>
              <Text style={S.changeBtn}>Change</Text>
            </Animated.View>
          </Pressable>
        )}
      </Row>

      {/* ── Success: profile display ── */}
      {isSuccess && state.status === 'success' && (
        <ProfileDisplay profile={state.profile} />
      )}

      {/* ── Loading: skeleton ── */}
      {isLoading && <ProfileSkeleton />}

      {/* ── Idle / Error: input ── */}
      {(isIdle || isError) && (
        <View style={S.inputSection}>
          {isError && (
            <View style={S.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color={Colors.warning} />
              <Text style={S.errorText}>{state.status === 'error' ? state.message : ''}</Text>
            </View>
          )}

          <Row style={S.inputRow}>
            <View style={S.inputWrap}>
              <Text style={S.inputPrefix}>github.com/</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                onSubmitEditing={handleConnect}
                placeholder="username"
                placeholderTextColor={Colors.text4}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="done"
                style={S.input}
              />
            </View>

            <Pressable
              onPress={handleConnect}
              onPressIn={btnIn}
              onPressOut={btnOut}
              disabled={!username.trim() || !!validationError || isSaving}>
              <Animated.View style={[
                S.connectBtn,
                (!username.trim() || !!validationError) && S.connectBtnDisabled,
                { transform: [{ scale: btnScale }] },
              ]}>
                {isSaving
                  ? <ActivityIndicator size="small" color={GH_COLOR} />
                  : <Text style={[
                      S.connectBtnTxt,
                      (!username.trim() || !!validationError) && S.connectBtnTxtDisabled,
                    ]}>
                      {isNewUsername || !hasSaved ? 'Connect' : 'Load'}
                    </Text>}
              </Animated.View>
            </Pressable>
          </Row>

          {validationError && (
            <Text style={S.validationError}>{validationError}</Text>
          )}

          {!hasSaved && !username && (
            <Text style={S.hint}>
              Connect your GitHub to display public repos and profile info.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── ProfileDisplay ───────────────────────────────────────────────────────────

function ProfileDisplay({ profile }: { profile: GitHubProfile }) {
  const { opacity, translateY } = useFadeSlideIn(0, 6);
  const { scale, onPressIn, onPressOut } = usePressScale(0.98);

  const openProfile = useCallback(() => {
    WebBrowser.openBrowserAsync(profile.html_url);
  }, [profile.html_url]);

  const joined = profile.created_at
    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
        new Date(profile.created_at)
      )
    : null;

  return (
    <Animated.View style={[S.profileWrap, { opacity, transform: [{ translateY }] }]}>
      {/* Avatar + name row */}
      <Row style={S.profileTop}>
        <Image
          source={{ uri: profile.avatar_url }}
          style={S.avatar}
          contentFit="cover"
          transition={200}
        />
        <View style={S.profileMeta}>
          <Text style={S.profileName} numberOfLines={1}>
            {profile.name || profile.login}
          </Text>
          <Text style={S.profileLogin}>@{profile.login}</Text>
          {profile.bio ? (
            <Text style={S.profileBio} numberOfLines={2}>{profile.bio}</Text>
          ) : null}
        </View>
      </Row>

      {/* Stats row */}
      <Row style={S.statsRow}>
        <StatItem value={profile.public_repos} label="repos" />
        <View style={S.statDivider} />
        <StatItem value={profile.followers} label="followers" />
        <View style={S.statDivider} />
        <StatItem value={profile.following} label="following" />
      </Row>

      {/* Meta info — location, company, joined */}
      {(profile.location || profile.company || joined) ? (
        <Row style={S.metaRow}>
          {profile.location ? (
            <Row style={S.metaItem}>
              <Ionicons name="location-outline" size={12} color={Colors.text4} />
              <Text style={S.metaText} numberOfLines={1}>{profile.location}</Text>
            </Row>
          ) : null}
          {profile.company ? (
            <Row style={S.metaItem}>
              <Ionicons name="business-outline" size={12} color={Colors.text4} />
              <Text style={S.metaText} numberOfLines={1}>
                {profile.company.replace(/^@/, '')}
              </Text>
            </Row>
          ) : null}
          {joined ? (
            <Row style={S.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={Colors.text4} />
              <Text style={S.metaText}>Joined {joined}</Text>
            </Row>
          ) : null}
        </Row>
      ) : null}

      {/* Link to full profile */}
      <Pressable
        onPress={openProfile}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <Animated.View style={[S.profileLink, { transform: [{ scale }] }]}>
          <Ionicons name="open-outline" size={13} color={GH_COLOR} />
          <Text style={S.profileLinkTxt}>
            github.com/{profile.login}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ─── StatItem ─────────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={S.statItem}>
      <Text style={S.statValue}>{formatCount(value)}</Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );
}

// ─── ProfileSkeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <View style={S.skeletonWrap}>
      <Row style={{ gap: 12, alignItems: 'flex-start' }}>
        <Skeleton width={48} height={48} radius={Radius.full} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={14} width="50%" />
          <Skeleton height={11} width="35%" />
          <Skeleton height={11} width="80%" />
        </View>
      </Row>
      <Skeleton height={32} radius={Radius.sm} style={{ marginTop: 12 }} />
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: {
    gap: 12,
  },

  // Section header
  sectionHead: {
    alignItems: 'center',
    gap: 8,
  },
  ghDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: GH_COLOR,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text0,
    flex: 1,
  },
  changeBtn: {
    ...Typography.bodyXs,
    color: Colors.text3,
    fontWeight: '500',
  },

  // Input section
  inputSection: {
    gap: 8,
  },
  inputRow: {
    gap: 10,
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 12,
  },
  inputPrefix: {
    ...Typography.bodySm,
    color: Colors.text4,
  },
  input: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.text0,
    height: 44,
    paddingLeft: 0,
  },
  connectBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: GH_COLOR + '55',
    backgroundColor: GH_COLOR + '14',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  connectBtnDisabled: {
    borderColor: Colors.border1,
    backgroundColor: 'transparent',
  },
  connectBtnTxt: {
    ...Typography.uiSm,
    color: GH_COLOR,
    fontWeight: '600',
  },
  connectBtnTxtDisabled: {
    color: Colors.text4,
  },
  validationError: {
    ...Typography.bodyXs,
    color: Colors.warning,
    marginTop: 2,
  },
  hint: {
    ...Typography.bodyXs,
    color: Colors.text4,
    lineHeight: 18,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  errorText: {
    ...Typography.bodyXs,
    color: Colors.warning,
    flex: 1,
    lineHeight: 18,
  },

  // Profile display
  profileWrap: {
    gap: 12,
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  profileTop: {
    gap: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg4,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...Typography.h4,
    color: Colors.text0,
  },
  profileLogin: {
    ...Typography.bodyXs,
    color: Colors.text3,
  },
  profileBio: {
    ...Typography.bodyXs,
    color: Colors.text2,
    lineHeight: 17,
    marginTop: 4,
  },

  // Stats
  statsRow: {
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border0,
    paddingTop: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border0,
  },
  statValue: {
    ...Typography.h4,
    color: Colors.text0,
  },
  statLabel: {
    ...Typography.bodyXs,
    color: Colors.text3,
  },

  // Meta row (location, company, joined)
  metaRow: {
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border0,
    paddingTop: 10,
  },
  metaItem: {
    gap: 4,
    alignItems: 'center',
  },
  metaText: {
    ...Typography.bodyXs,
    color: Colors.text3,
  },

  // Profile link
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: Colors.border0,
    paddingTop: 10,
  },
  profileLinkTxt: {
    ...Typography.bodyXs,
    color: GH_COLOR,
    fontWeight: '500',
  },

  // Skeleton
  skeletonWrap: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
  },
});
