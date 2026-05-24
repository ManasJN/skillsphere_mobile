/**
 * CodingProfileSheet — connect and sync coding platform profiles.
 *
 * Three platforms in one modal:
 *   LeetCode  — auto-import via server-side GraphQL (PUT /users/:id/import/leetcode)
 *   GitHub    — auto-import via GitHub REST API    (PUT /users/:id/import/github)
 *   Codeforces — manual rating entry              (PUT /users/:id/coding-stats)
 *
 * Design:
 *   - Platform sections separated by dividers, not cards-in-a-card
 *   - Username input + "Sync" button inline per platform
 *   - Live result preview after each sync (what was fetched)
 *   - Codeforces: text inputs only (no API auto-import server-side)
 *   - Save button commits all manual Codeforces entries
 *   - No gamification — this is a utility screen
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { usersAPI } from '@/lib/api';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { Divider, ErrorBanner, ProgressBar, Row } from '@/components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type CodingStats = {
  leetcodeSolved?: number;
  leetcodeEasy?: number;
  leetcodeMedium?: number;
  leetcodeHard?: number;
  contestsParticipated?: number;
  codeforcesRating?: number;
  codeforcesMaxRating?: number;
  githubRepos?: number;
  githubContributions?: number;
};

type PlatformProfiles = {
  leetcode?: string;
  github?: string;
  codeforces?: string;
};

type GitHubImportResult = {
  username?: string;
  publicRepos?: number;
  followers?: number;
  totalStars?: number;
  topLanguages?: { name: string; count: number }[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialStats?: CodingStats;
  initialProfiles?: PlatformProfiles;
  onSaved: (updatedUser: any) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CodingProfileSheet({
  visible, onClose, userId, initialStats, initialProfiles, onSaved,
}: Props) {
  // LeetCode
  const [lcUsername,  setLcUsername]  = useState('');
  const [lcSyncing,   setLcSyncing]   = useState(false);
  const [lcResult,    setLcResult]    = useState<CodingStats | null>(null);
  const [lcError,     setLcError]     = useState('');

  // GitHub
  const [ghUsername,  setGhUsername]  = useState('');
  const [ghSyncing,   setGhSyncing]   = useState(false);
  const [ghResult,    setGhResult]    = useState<GitHubImportResult | null>(null);
  const [ghError,     setGhError]     = useState('');

  // Codeforces (manual)
  const [cfRating,    setCfRating]    = useState('');
  const [cfMaxRating, setCfMaxRating] = useState('');
  const [cfUsername,  setCfUsername]  = useState('');
  const [cfSaving,    setCfSaving]    = useState(false);
  const [cfSaved,     setCfSaved]     = useState(false);
  const [cfError,     setCfError]     = useState('');

  // Populate from existing data
  useEffect(() => {
    if (!visible) return;
    setLcUsername(initialProfiles?.leetcode ?? '');
    setGhUsername(initialProfiles?.github ?? '');
    setCfUsername(initialProfiles?.codeforces ?? '');
    setCfRating(initialStats?.codeforcesRating ? String(initialStats.codeforcesRating) : '');
    setCfMaxRating(initialStats?.codeforcesMaxRating ? String(initialStats.codeforcesMaxRating) : '');
    setLcResult(null); setLcError('');
    setGhResult(null); setGhError('');
    setCfSaved(false); setCfError('');
  }, [visible, initialStats, initialProfiles]);

  // ── LeetCode sync ──────────────────────────────────────────────────────────
  const syncLeetCode = async () => {
    const u = lcUsername.trim();
    if (!u) { setLcError('Enter your LeetCode username.'); return; }
    setLcSyncing(true); setLcError(''); setLcResult(null);
    try {
      const res = await usersAPI.importLeetCode(userId, u);
      const data = res.data;
      setLcResult(data.imported ?? data.data?.codingStats ?? null);
      onSaved(data.data ?? data.freshUser);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'LeetCode sync failed.';
      setLcError(msg);
    } finally { setLcSyncing(false); }
  };

  // ── GitHub sync ────────────────────────────────────────────────────────────
  const syncGitHub = async () => {
    const u = ghUsername.trim();
    if (!u) { setGhError('Enter your GitHub username.'); return; }
    setGhSyncing(true); setGhError(''); setGhResult(null);
    try {
      const res = await usersAPI.importGitHub(userId, u);
      const data = res.data;
      setGhResult(data.imported ?? null);
      onSaved(data.data ?? data.freshUser);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'GitHub sync failed.';
      setGhError(msg);
    } finally { setGhSyncing(false); }
  };

  // ── Codeforces save ────────────────────────────────────────────────────────
  const saveCF = async () => {
    const rating    = parseInt(cfRating, 10);
    const maxRating = parseInt(cfMaxRating, 10);
    if (!cfRating && !cfUsername) { setCfError('Enter at least your rating or username.'); return; }
    setCfSaving(true); setCfError(''); setCfSaved(false);
    try {
      const payload: Record<string, unknown> = {};
      if (!isNaN(rating))    payload.codeforcesRating    = rating;
      if (!isNaN(maxRating)) payload.codeforcesMaxRating = maxRating;
      const res = await usersAPI.updateCodingStats(userId, payload);
      // Also save platformProfiles.codeforces username if entered
      if (cfUsername.trim()) {
        await usersAPI.update(userId, {
          platformProfiles: { codeforces: cfUsername.trim() },
        });
      }
      onSaved(res.data.data);
      setCfSaved(true);
    } catch (e: any) {
      setCfError(e?.response?.data?.message ?? 'Could not save Codeforces info.');
    } finally { setCfSaving(false); }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={S.root}>

        {/* Header */}
        <View style={S.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={Colors.text2} />
          </Pressable>
          <Text style={S.headerTitle}>Coding profiles</Text>
          <View style={{ width: 28 }} />
        </View>
        <Divider />

        <ScrollView
          contentContainerStyle={S.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Text style={S.intro}>
            Connect your platforms to automatically sync stats and earn XP.
          </Text>

          {/* ── LeetCode ── */}
          <PlatformSection
            name="LeetCode"
            color="#FFA116"
            connected={!!initialProfiles?.leetcode || !!lcResult}
            connectedLabel={lcResult ? `Synced ${lcResult.leetcodeSolved ?? 0} solved` : initialProfiles?.leetcode}
            error={lcError}
            syncing={lcSyncing}
            onSync={syncLeetCode}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setLcUsername}
              placeholder="LeetCode username"
              placeholderTextColor={Colors.text4}
              returnKeyType="done"
              onSubmitEditing={syncLeetCode}
              style={S.input}
              value={lcUsername}
            />
            {lcResult && (
              <View style={S.resultBox}>
                <Text style={S.resultTitle}>Synced successfully</Text>
                <Row style={S.statRow}>
                  {[
                    { label: 'Solved',   value: lcResult.leetcodeSolved ?? 0,   color: Colors.accent },
                    { label: 'Easy',     value: lcResult.leetcodeEasy ?? 0,     color: Colors.success },
                    { label: 'Medium',   value: lcResult.leetcodeMedium ?? 0,   color: Colors.warning },
                    { label: 'Hard',     value: lcResult.leetcodeHard ?? 0,     color: Colors.danger },
                  ].map(s => (
                    <View key={s.label} style={S.statCell}>
                      <Text style={[S.statVal, { color: s.color }]}>{s.value}</Text>
                      <Text style={S.statLbl}>{s.label}</Text>
                    </View>
                  ))}
                </Row>
                {/* Easy / medium / hard breakdown bar */}
                {(lcResult.leetcodeSolved ?? 0) > 0 && (
                  <View style={S.breakdownBar}>
                    {[
                      { v: lcResult.leetcodeEasy ?? 0,   c: Colors.success },
                      { v: lcResult.leetcodeMedium ?? 0, c: Colors.warning },
                      { v: lcResult.leetcodeHard ?? 0,   c: Colors.danger },
                    ].map(({ v, c }, i) => {
                      const pct = ((v / (lcResult.leetcodeSolved || 1)) * 100);
                      return pct > 0
                        ? <View key={i} style={{ flex: pct, backgroundColor: c, height: 4 }} />
                        : null;
                    })}
                  </View>
                )}
              </View>
            )}
          </PlatformSection>

          <Divider />

          {/* ── GitHub ── */}
          <PlatformSection
            name="GitHub"
            color="#8B949E"
            connected={!!initialProfiles?.github || !!ghResult}
            connectedLabel={ghResult ? `${ghResult.publicRepos ?? 0} repos` : initialProfiles?.github}
            error={ghError}
            syncing={ghSyncing}
            onSync={syncGitHub}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setGhUsername}
              placeholder="GitHub username"
              placeholderTextColor={Colors.text4}
              returnKeyType="done"
              onSubmitEditing={syncGitHub}
              style={S.input}
              value={ghUsername}
            />
            {ghResult && (
              <View style={S.resultBox}>
                <Text style={S.resultTitle}>Synced successfully</Text>
                <Row style={S.statRow}>
                  {[
                    { label: 'Repos',    value: ghResult.publicRepos ?? 0 },
                    { label: 'Stars',    value: ghResult.totalStars ?? 0 },
                    { label: 'Followers',value: ghResult.followers ?? 0 },
                  ].map(s => (
                    <View key={s.label} style={S.statCell}>
                      <Text style={[S.statVal, { color: Colors.text0 }]}>{s.value}</Text>
                      <Text style={S.statLbl}>{s.label}</Text>
                    </View>
                  ))}
                </Row>
                {(ghResult.topLanguages?.length ?? 0) > 0 && (
                  <View style={S.langRow}>
                    {ghResult.topLanguages!.map(l => (
                      <View key={l.name} style={S.langChip}>
                        <Text style={S.langTxt}>{l.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </PlatformSection>

          <Divider />

          {/* ── Codeforces (manual) ── */}
          <PlatformSection
            name="Codeforces"
            color="#1F8ACF"
            connected={!!initialProfiles?.codeforces || cfSaved}
            connectedLabel={cfSaved ? 'Saved' : initialProfiles?.codeforces}
            note="Auto-import not available — enter your rating manually."
            error={cfError}
            syncing={cfSaving}
            syncLabel={cfSaved ? 'Saved' : 'Save'}
            onSync={saveCF}>
            <TextInput
              autoCapitalize="none"
              onChangeText={setCfUsername}
              placeholder="Codeforces handle (optional)"
              placeholderTextColor={Colors.text4}
              style={S.input}
              value={cfUsername}
            />
            <Row style={{ gap: 10 }}>
              <TextInput
                keyboardType="numeric"
                maxLength={5}
                onChangeText={setCfRating}
                placeholder="Current rating"
                placeholderTextColor={Colors.text4}
                style={[S.input, { flex: 1 }]}
                value={cfRating}
              />
              <TextInput
                keyboardType="numeric"
                maxLength={5}
                onChangeText={setCfMaxRating}
                placeholder="Max rating"
                placeholderTextColor={Colors.text4}
                style={[S.input, { flex: 1 }]}
                value={cfMaxRating}
              />
            </Row>
          </PlatformSection>

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── PlatformSection ──────────────────────────────────────────────────────────

type PlatformSectionProps = {
  name: string;
  color: string;
  connected: boolean;
  connectedLabel?: string;
  note?: string;
  error: string;
  syncing: boolean;
  syncLabel?: string;
  onSync: () => void;
  children: React.ReactNode;
};

function PlatformSection({
  name, color, connected, connectedLabel, note,
  error, syncing, syncLabel = 'Sync', onSync, children,
}: PlatformSectionProps) {
  return (
    <View style={pS.wrap}>
      <Row style={pS.head}>
        {/* Color dot instead of platform logo */}
        <View style={[pS.dot, { backgroundColor: color }]} />
        <Text style={pS.name}>{name}</Text>
        {connected && connectedLabel ? (
          <View style={pS.connectedBadge}>
            <Ionicons name="checkmark" size={11} color={Colors.success} />
            <Text style={pS.connectedTxt}>{connectedLabel}</Text>
          </View>
        ) : null}
      </Row>

      {note ? <Text style={pS.note}>{note}</Text> : null}
      {error ? <ErrorBanner message={error} /> : null}

      <View style={pS.inputRow}>
        <View style={{ flex: 1 }}>{children}</View>
        <Pressable
          onPress={onSync}
          disabled={syncing}
          style={[pS.syncBtn, { borderColor: color + '66', backgroundColor: color + '18' }, syncing && { opacity: 0.5 }]}>
          {syncing
            ? <ActivityIndicator size="small" color={color} />
            : <Text style={[pS.syncTxt, { color }]}>{syncLabel}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const pS = StyleSheet.create({
  wrap:     { gap: 12, paddingVertical: Spacing.lg },
  head:     { gap: 10, alignItems: 'center' },
  dot:      { borderRadius: Radius.full, height: 10, width: 10 },
  name:     { ...Typography.h4, color: Colors.text0, flex: 1 },
  connectedBadge: {
    alignItems: 'center', backgroundColor: '#0A1A12',
    borderColor: '#163324', borderRadius: Radius.xs, borderWidth: 1,
    flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  connectedTxt: { ...Typography.bodyXs, color: Colors.success, fontWeight: '600' as const },
  note:     { ...Typography.bodyXs, color: Colors.text3 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  syncBtn: {
    alignItems: 'center', borderRadius: Radius.sm, borderWidth: 1,
    height: 48, justifyContent: 'center', minWidth: 68,
  },
  syncTxt:  { ...Typography.uiSm, fontWeight: '700' as const },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:    { backgroundColor: Colors.bg1, flex: 1 },
  header:  {
    alignItems: 'center', flexDirection: 'row',
    height: 54, justifyContent: 'space-between', paddingHorizontal: Spacing.lg,
  },
  headerTitle: { ...Typography.h4, color: Colors.text0 },
  body:    { gap: 0, paddingBottom: 40, paddingHorizontal: Spacing.lg },
  intro:   { ...Typography.bodySm, color: Colors.text3, paddingVertical: Spacing.lg, lineHeight: 20 },

  input: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1,
    color: Colors.text0, fontSize: 15, height: 48, paddingHorizontal: 14,
  },

  resultBox: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1, gap: 10, padding: 12,
  },
  resultTitle: { ...Typography.bodyXs, color: Colors.success, fontWeight: '600' as const },
  statRow:     { gap: 8 },
  statCell:    {
    alignItems: 'center', flex: 1, gap: 3,
    backgroundColor: Colors.bg4, borderRadius: Radius.xs, paddingVertical: 8,
  },
  statVal:     { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  statLbl:     { ...Typography.bodyXs, color: Colors.text3 },
  breakdownBar:{ borderRadius: Radius.full, flexDirection: 'row', height: 4, overflow: 'hidden', marginTop: 2 },

  langRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  langChip: {
    backgroundColor: Colors.bg4, borderColor: Colors.border1,
    borderRadius: Radius.xs, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  langTxt:  { ...Typography.bodyXs, color: Colors.text2, fontWeight: '500' as const },
});
