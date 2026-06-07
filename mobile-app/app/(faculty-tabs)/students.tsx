/**
 * app/(faculty-tabs)/students.tsx — Faculty Student List
 *
 * Phase 1: searchable student list; tap any student to open their
 * existing portfolio.tsx screen in read-only mode (reuses the student
 * side portfolio entirely — no duplication).
 *
 * Optional ?highlight=<id> param from dashboard "See all" tap —
 * scrolls to that student (best-effort, no hard dependency).
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { facultyAPI, type FacultyStudent } from '@/lib/faculty';
import {
  Colors, Layout, NAV_BOTTOM_OFFSET, Radius,
  Spacing, Typography,
} from '@/lib/theme';

// ─── Verification badge chip ──────────────────────────────────────────────────

const VSTATUS: Record<string, { label: string; color: string; bg: string }> = {
  verified:    { label: 'Verified',  color: Colors.success, bg: Colors.status.successBg },
  pending:     { label: 'Pending',   color: Colors.warning, bg: Colors.status.warningBg },
  rejected:    { label: 'Rejected',  color: Colors.danger,  bg: Colors.status.dangerBg  },
  unsubmitted: { label: 'None',      color: Colors.text4,   bg: Colors.bg3              },
};

function VChip({ status }: { status?: string }) {
  const cfg = VSTATUS[status ?? 'unsubmitted'] ?? VSTATUS.unsubmitted;
  return (
    <View style={[S.vchip, { backgroundColor: cfg.bg }]}>
      <Text style={[S.vchipText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Student card ─────────────────────────────────────────────────────────────

function StudentCard({
  student,
  onPress,
}: { student: FacultyStudent; onPress: () => void }) {
  const name = student.name?.trim() || 'Student';
  const initials = name
    .split(' ')
    .filter((p: string) => p.length > 0)
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SS';

  const xp      = student.xpPoints ?? 0;
  const level   = student.level ?? (Math.floor(xp / 500) + 1);
  const lc      = student.codingStats?.leetcodeSolved ?? 0;
  const githubConnected = !!(student as any).platformProfiles?.github ||
                           !!(student as any).githubUsername;

  return (
    <Pressable style={S.card} onPress={onPress} android_ripple={{ color: Colors.border1 }}>
      <View style={S.cardInner}>

        {/* Avatar + Level badge */}
        <View style={S.avatarWrap}>
          <View style={S.avatar}>
            <Text style={S.avatarText}>{initials}</Text>
          </View>
          <View style={S.levelBadge}>
            <Text style={S.levelText}>L{level}</Text>
          </View>
        </View>

        {/* Main info */}
        <View style={{ flex: 1, gap: 3 }}>
          {/* Name + dept */}
          <Text style={S.cardName} numberOfLines={1}>{name}</Text>
          <Text style={S.cardMeta} numberOfLines={1}>
            {[student.department, student.rollNumber]
              .filter(Boolean).join(' · ') || 'JEC'}
          </Text>

          {/* XP bar */}
          <View style={S.xpRow}>
            <Ionicons name="star" size={10} color={Colors.warning} />
            <Text style={S.xpText}>{xp.toLocaleString()} XP</Text>
          </View>

          {/* Stat chips row */}
          <View style={S.statsRow}>
            {/* LeetCode */}
            <View style={[S.chip, { backgroundColor: lc > 0 ? Colors.accentDim : Colors.bg3 }]}>
              <Ionicons name="code-slash-outline" size={10} color={lc > 0 ? Colors.accent : Colors.text4} />
              <Text style={[S.chipText, { color: lc > 0 ? Colors.accent : Colors.text4 }]}>
                {lc > 0 ? `${lc} LC` : 'LC –'}
              </Text>
            </View>

            {/* GitHub connected */}
            <View style={[S.chip, { backgroundColor: githubConnected ? Colors.accentDim : Colors.bg3 }]}>
              <Ionicons name="logo-github" size={10} color={githubConnected ? Colors.accent : Colors.text4} />
              <Text style={[S.chipText, { color: githubConnected ? Colors.accent : Colors.text4 }]}>
                {githubConnected ? 'GitHub ✓' : 'GitHub –'}
              </Text>
            </View>
          </View>
        </View>

        {/* Right side */}
        <View style={S.cardRight}>
          <VChip status={student.verificationStatus} />
          <Ionicons name="chevron-forward" size={16} color={Colors.text4} style={{ marginTop: 6 }} />
        </View>

      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StudentsScreen() {
  const params           = useLocalSearchParams<{ highlight?: string }>();
  const [all, setAll]    = useState<FacultyStudent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery]         = useState('');
  const [error, setError]         = useState('');
  const flatRef = useRef<FlatList>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await facultyAPI.getStudents();
      const students: FacultyStudent[] = res.data?.data ?? res.data ?? [];
      setAll(students);

      // Scroll to highlighted student after render
      if (params.highlight) {
        const idx = students.findIndex(s => s._id === params.highlight);
        if (idx > -1) {
          setTimeout(() => flatRef.current?.scrollToIndex({ index: idx, animated: true }), 400);
        }
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not load students.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.highlight]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const list = !query.trim()
      ? all
      : (() => {
          const q = query.toLowerCase();
          return all.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.department ?? '').toLowerCase().includes(q) ||
            (s.rollNumber ?? '').toLowerCase().includes(q) ||
            (s.email ?? '').toLowerCase().includes(q),
          );
        })();
    // Sort by XP descending — top performers first
    return [...list].sort((a, b) => (b.xpPoints ?? 0) - (a.xpPoints ?? 0));
  }, [all, query]);

  // Open the dedicated read-only faculty detail screen.
  const openStudent = useCallback((student: FacultyStudent) => {
    router.push(`/faculty-student/${student._id}` as any);
  }, []);

  const renderItem = useCallback(({ item }: { item: FacultyStudent }) => (
    <StudentCard student={item} onPress={() => openStudent(item)} />
  ), [openStudent]);

  const keyExtractor = useCallback((item: FacultyStudent) => item._id, []);

  return (
    <SafeAreaView edges={['top']} style={S.root}>

      {/* Header */}
      <View style={S.header}>
        <Text style={S.title}>Students</Text>
        {!loading && (
          <View style={S.countBadge}>
            <Text style={S.countText}>{all.length}</Text>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View style={S.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.text3} style={S.searchIcon} />
        <TextInput
          style={S.searchInput}
          placeholder="Search by name or roll number…"
          placeholderTextColor={Colors.text4}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={Colors.text3} />
          </Pressable>
        )}
      </View>

      {error ? (
        <View style={S.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={S.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={S.loadingWrap}>
          <ActivityIndicator color={Colors.accent} />
          <Text style={S.loadingText}>Loading students…</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[S.list, { paddingBottom: NAV_BOTTOM_OFFSET + Spacing.lg }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent} />
          }
          onScrollToIndexFailed={() => {}} // suppress warning if index OOB
          ItemSeparatorComponent={() => <View style={S.sep} />}
          ListEmptyComponent={
            <View style={S.empty}>
              <Ionicons name="people-outline" size={32} color={Colors.text4} />
              <Text style={S.emptyTitle}>
                {query ? 'No students found' : 'No students yet'}
              </Text>
              <Text style={S.emptyBody}>
                {query
                  ? 'Try a different name or roll number.'
                  : 'No students have registered yet.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h2, color: Colors.text0 },
  countBadge: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid, borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1, borderWidth: 1,
    borderRadius: Radius.md,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
  },
  searchIcon:  {},
  searchInput: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.text0,
    padding: 0,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.status.dangerBg,
    borderColor: Colors.status.dangerBorder, borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.sm,
  },
  errorText: { ...Typography.bodySm, color: Colors.danger, flex: 1 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.bodySm, color: Colors.text3 },

  list: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.xs },
  sep:  { height: 1, backgroundColor: Colors.border0 },

  card: { backgroundColor: Colors.bg1 },
  cardInner: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },

  // Avatar with level badge overlay
  avatarWrap: { position: 'relative', width: 44, height: 44 },
  avatar: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.uiSm, color: Colors.accent, fontWeight: '700' },
  levelBadge: {
    position: 'absolute', bottom: -3, right: -3,
    backgroundColor: Colors.bg3,
    borderColor: Colors.accentMid, borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 4, paddingVertical: 1,
    minWidth: 20, alignItems: 'center',
  },
  levelText: { fontSize: 8, fontWeight: '700', color: Colors.accent },

  cardName:    { ...Typography.uiSm, color: Colors.text0, fontWeight: '600' },
  cardMeta:    { ...Typography.bodyXs, color: Colors.text3 },
  cardRight:   { alignItems: 'flex-end', gap: Spacing.xxs },

  // XP row
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  xpText: { ...Typography.bodyXs, color: Colors.warning, fontWeight: '600' },

  // Stat chips
  statsRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: 3, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: Radius.xs,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  chipText: { fontSize: 10, fontWeight: '600' },

  vchip: { borderRadius: Radius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  vchipText: { ...Typography.bodyXs, fontWeight: '600', fontSize: 10 },

  empty: {
    alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: { ...Typography.h4, color: Colors.text2, marginTop: Spacing.sm },
  emptyBody:  { ...Typography.bodySm, color: Colors.text4, textAlign: 'center' },
});
