/**
 * app/(faculty-tabs)/dashboard.tsx — Faculty Dashboard
 *
 * Enhanced with 4 Statistics Cards:
 *   Card 1: Total Students      (from /faculty/stats)
 *   Card 2: Active Students     (from /faculty/stats → activeThisWeek)
 *   Card 3: Top Performer       (from /leaderboard → [0])
 *   Card 4: Announcements       (from /announcements count)
 *
 * Data strategy: zero new backend endpoints — reuses existing APIs.
 * All stats are fetched in a single parallel Promise.all().
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { announcementsAPI, authAPI, leaderboardAPI } from '@/lib/api';
import { facultyAPI, type FacultyStats, type FacultyStudent } from '@/lib/faculty';
import {
  Colors, Layout, NAV_BOTTOM_OFFSET, Radius,
  Spacing, Surface, Typography,
} from '@/lib/theme';
import { Card, Row, Skeleton, SkeletonCard } from '@/components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type Leader = {
  _id: string;
  name?: string;
  xpPoints?: number;
  department?: string;
};

type DashData = {
  stats: FacultyStats | null;
  topStudents: FacultyStudent[];
  facultyName: string;
  collegeName: string;
  topPerformer: Leader | null;
  announcementCount: number;
};

// ─── Animated stat card ───────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  bgColor: string;
  delay?: number;
};

function StatCard({ label, value, subtitle, icon, color, bgColor, delay = 0 }: StatCardProps) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 380, delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 380, delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[S.statCard, { opacity, transform: [{ translateY }] }]}>
      {/* top row: icon + subtle glow backdrop */}
      <View style={[S.statIconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>

      {/* value */}
      <Text style={[S.statValue, { color: Colors.text0 }]} numberOfLines={1}>{value}</Text>

      {/* label */}
      <Text style={S.statLabel} numberOfLines={1}>{label}</Text>

      {/* optional subtitle */}
      {subtitle ? (
        <Text style={[S.statSub, { color }]} numberOfLines={1}>{subtitle}</Text>
      ) : null}

      {/* bottom accent bar */}
      <View style={[S.statBar, { backgroundColor: color }]} />
    </Animated.View>
  );
}

function StatCardSkeleton() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[S.statCard, S.statCardSkel, { opacity: pulse }]}>
      <View style={[S.statIconWrap, { backgroundColor: Colors.border0 }]} />
      <View style={[S.skelLine, { width: '55%', marginTop: 10 }]} />
      <View style={[S.skelLine, { width: '80%', marginTop: 6 }]} />
    </Animated.View>
  );
}

// ─── Student row (mini) ───────────────────────────────────────────────────────

function StudentRow({ student }: { student: FacultyStudent }) {
  const initials = student.name
    .split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Pressable
      style={S.studentRow}
      onPress={() => router.push(`/(faculty-tabs)/students?highlight=${student._id}`)}>
      <View style={S.avatar}>
        <Text style={S.avatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.studentName} numberOfLines={1}>{student.name}</Text>
        <Text style={S.studentMeta} numberOfLines={1}>
          {student.department ?? 'Unknown dept'} · Sem {student.semester ?? '—'}
        </Text>
      </View>
      <View style={S.xpBadge}>
        <Text style={S.xpText}>{student.xpPoints ?? 0} XP</Text>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FacultyDashboard() {
  const [data, setData] = useState<DashData>({
    stats: null,
    topStudents: [],
    facultyName: '',
    collegeName: '',
    topPerformer: null,
    announcementCount: 0,
  });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [meRes, statsRes, studentsRes, leaderboardRes, announcementsRes] =
        await Promise.all([
          authAPI.me(),
          facultyAPI.getStats(),
          facultyAPI.getStudents({ limit: '5', sort: 'xpPoints' }),
          leaderboardAPI.get().catch(() => null),
          announcementsAPI.getAll({ limit: '50' }).catch(() => null),
        ]);

      const me       = meRes.data?.data ?? meRes.data;
      const stats: FacultyStats = statsRes.data?.data ?? statsRes.data;
      const students: FacultyStudent[] = studentsRes.data?.data ?? studentsRes.data ?? [];

      // Top performer: first entry from leaderboard (already sorted by XP desc)
      const leaderList: Leader[] = leaderboardRes?.data?.data ?? leaderboardRes?.data ?? [];
      const topPerformer: Leader | null = leaderList[0] ?? null;

      // Announcement count from all published announcements
      const announcementList: any[] =
        announcementsRes?.data?.data ?? announcementsRes?.data ?? [];
      const announcementCount = Array.isArray(announcementList)
        ? announcementList.length
        : 0;

      setData({
        stats,
        topStudents:      students.slice(0, 5),
        facultyName:      me?.name ?? 'Faculty',
        collegeName:      me?.collegeId?.collegeName ?? me?.college ?? 'Jorhat Engineering College',
        topPerformer,
        announcementCount,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { stats, topStudents, facultyName, collegeName, topPerformer, announcementCount } = data;

  // Derived stat card values
  const totalStudents   = stats?.totalStudents  ?? 0;
  const activeStudents  = stats?.activeThisWeek ?? 0;
  const topName         = topPerformer?.name
    ? topPerformer.name.split(' ')[0]   // first name only — keeps card compact
    : '—';
  const topXP           = topPerformer?.xpPoints ?? 0;

  return (
    <SafeAreaView edges={['top']} style={S.root}>
      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: NAV_BOTTOM_OFFSET + Spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={S.header}>
          <View style={{ flex: 1 }}>
            <Text style={S.greeting}>Good day,</Text>
            <Text style={S.name} numberOfLines={1}>{facultyName}</Text>
            <Text style={S.college} numberOfLines={1}>{collegeName}</Text>
          </View>
          <View style={S.roleBadge}>
            <Ionicons name="school-outline" size={14} color={Colors.accent} />
            <Text style={S.roleBadgeText}>Faculty</Text>
          </View>
        </View>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error ? (
          <View style={S.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text style={S.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Statistics Cards ──────────────────────────────────────────── */}
        <View style={S.statsHeader}>
          <Ionicons name="stats-chart-outline" size={14} color={Colors.text3} />
          <Text style={S.sectionTitle}>Platform Overview</Text>
        </View>

        <View style={S.statsGrid}>
          {loading ? (
            [0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)
          ) : (
            <>
              {/* Card 1 — Total Students */}
              <StatCard
                label="Total Students"
                value={totalStudents}
                subtitle="Registered"
                icon="people-outline"
                color={Colors.accent}
                bgColor={Colors.accentDim}
                delay={0}
              />

              {/* Card 2 — Active Students */}
              <StatCard
                label="Active Students"
                value={activeStudents}
                subtitle="This week"
                icon="pulse-outline"
                color={Colors.success}
                bgColor={Colors.status.successBg}
                delay={60}
              />

              {/* Card 3 — Top Performer */}
              <StatCard
                label="Top Performer"
                value={topName}
                subtitle={topXP > 0 ? `${topXP} XP` : undefined}
                icon="trophy-outline"
                color={Colors.warning}
                bgColor={Colors.status.warningBg}
                delay={120}
              />

              {/* Card 4 — Announcements */}
              <StatCard
                label="Announcements"
                value={announcementCount}
                subtitle="Published"
                icon="megaphone-outline"
                color={Colors.accentLight}
                bgColor={Colors.accentDim}
                delay={180}
              />
            </>
          )}
        </View>

        {/* ── Top Students ──────────────────────────────────────────────── */}
        <Row style={S.sectionRow}>
          <View style={S.sectionRowLeft}>
            <Ionicons name="podium-outline" size={14} color={Colors.text3} />
            <Text style={S.sectionTitle}>Top Students</Text>
          </View>
          <Pressable onPress={() => router.push('/(faculty-tabs)/students')} hitSlop={8}>
            <Text style={S.seeAll}>See all</Text>
          </Pressable>
        </Row>

        <Card style={S.listCard}>
          {loading ? (
            [0, 1, 2].map(i => <Skeleton key={i} style={S.skelRow} />)
          ) : topStudents.length === 0 ? (
            <View style={S.empty}>
              <Ionicons name="people-outline" size={28} color={Colors.text4} />
              <Text style={S.emptyText}>No students linked yet</Text>
            </View>
          ) : (
            topStudents.map((s, i) => (
              <View key={s._id}>
                <StudentRow student={s} />
                {i < topStudents.length - 1 && <View style={S.divider} />}
              </View>
            ))
          )}
        </Card>

        {/* ── Department breakdown ──────────────────────────────────────── */}
        {!loading && stats?.topDepartments && stats.topDepartments.length > 0 && (
          <>
            <Row style={S.sectionRow}>
              <View style={S.sectionRowLeft}>
                <Ionicons name="business-outline" size={14} color={Colors.text3} />
                <Text style={S.sectionTitle}>Departments</Text>
              </View>
            </Row>
            <Card style={S.listCard}>
              {stats.topDepartments.map((dept, i) => (
                <View key={dept.name}>
                  <Row style={S.deptRow}>
                    <Text style={S.deptName}>{dept.name}</Text>
                    <View style={S.deptCountBadge}>
                      <Text style={S.deptCount}>{dept.count}</Text>
                    </View>
                  </Row>
                  {i < stats.topDepartments.length - 1 && <View style={S.divider} />}
                </View>
              ))}
            </Card>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg1 },
  scroll: { paddingHorizontal: Layout.screenPadding, gap: Spacing.md },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: { ...Typography.bodySm, color: Colors.text3 },
  name:     { ...Typography.h2,     color: Colors.text0, marginTop: 2 },
  college:  { ...Typography.bodySm, color: Colors.text3, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  roleBadgeText: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.status.dangerBg,
    borderColor: Colors.status.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: { ...Typography.bodySm, color: Colors.danger, flex: 1 },

  // Section headers
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  sectionTitle: { ...Typography.h4, color: Colors.text1 },
  sectionRow:   {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sectionRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  seeAll:         { ...Typography.bodySm, color: Colors.accent },

  // ── Stats grid ────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

  statCard: {
    // Base card surface
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border1,
    borderRadius: Radius.lg,
    // take up ~half width
    width: '47.5%',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    // leave room for the bottom bar
    overflow: 'hidden',
    gap: 2,
  },
  statCardSkel: {
    height: 108,
  },

  statIconWrap: {
    width: 34, height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },

  statValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginTop: 2,
  },

  statLabel: {
    ...Typography.bodyXs,
    color: Colors.text3,
    marginTop: 1,
  },

  statSub: {
    ...Typography.bodyXs,
    fontWeight: '600',
    marginTop: 4,
  },

  // Colored accent line at the bottom of each stat card
  statBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    opacity: 0.6,
  },

  // skeleton shimmer lines inside skeleton cards
  skelLine: {
    height: 10,
    borderRadius: Radius.xs,
    backgroundColor: Colors.border1,
  },

  // ── List card ────────────────────────────────────────────────────────────
  listCard: { ...Surface.card, padding: 0, overflow: 'hidden' },
  divider:  { height: 1, backgroundColor: Colors.border0, marginHorizontal: Spacing.md },
  skelRow:  { height: 56, margin: Spacing.md, borderRadius: Radius.sm },

  // Student row
  studentRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, padding: Spacing.md,
  },
  avatar: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { ...Typography.uiSm, color: Colors.accent },
  studentName:  { ...Typography.uiSm, color: Colors.text0 },
  studentMeta:  { ...Typography.bodyXs, color: Colors.text3, marginTop: 1 },
  xpBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.xs,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  xpText: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' },

  // Department row
  deptRow: { padding: Spacing.md, justifyContent: 'space-between', alignItems: 'center' },
  deptName:       { ...Typography.uiSm, color: Colors.text1 },
  deptCountBadge: {
    backgroundColor: Colors.bg4,
    borderRadius: Radius.xs,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border1,
  },
  deptCount:      { ...Typography.bodyXs, color: Colors.text2, fontWeight: '600' },

  // Empty state
  empty:     { alignItems: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  emptyText: { ...Typography.bodySm, color: Colors.text4 },
});
