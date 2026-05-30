/**
 * app/(faculty-tabs)/dashboard.tsx — Faculty Dashboard
 *
 * Phase 1: aggregate stats + recent student activity snapshot.
 * Intentionally lightweight — one API call, one screen, impressive at a glance.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authAPI } from '@/lib/api';
import { facultyAPI, type FacultyStats, type FacultyStudent } from '@/lib/faculty';
import {
  Colors, Layout, NAV_BOTTOM_OFFSET, Radius,
  Spacing, Surface, Typography,
} from '@/lib/theme';
import { Card, Row, Skeleton, SkeletonCard } from '@/components/ui';

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color,
}: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <View style={[S.statCard, { borderColor: Colors.border1 }]}>
      <View style={[S.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={S.statValue}>{value}</Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
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

type DashData = {
  stats: FacultyStats | null;
  topStudents: FacultyStudent[];
  facultyName: string;
  collegeName: string;
};

export default function FacultyDashboard() {
  const [data, setData]       = useState<DashData>({
    stats: null, topStudents: [], facultyName: '', collegeName: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [meRes, statsRes, studentsRes] = await Promise.all([
        authAPI.me(),
        facultyAPI.getStats(),
        facultyAPI.getStudents({ limit: '5', sort: 'xpPoints' }),
      ]);

      const me = meRes.data?.data ?? meRes.data;
      const stats: FacultyStats = statsRes.data?.data ?? statsRes.data;
      const students: FacultyStudent[] = studentsRes.data?.data ?? studentsRes.data ?? [];

      setData({
        stats,
        topStudents: students.slice(0, 5),
        facultyName: me?.name ?? 'Faculty',
        collegeName: me?.collegeId?.collegeName ?? me?.college ?? 'Your College',
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { stats, topStudents, facultyName, collegeName } = data;

  return (
    <SafeAreaView edges={['top']} style={S.root}>
      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: NAV_BOTTOM_OFFSET + Spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.greeting}>Good day,</Text>
            <Text style={S.name} numberOfLines={1}>{facultyName}</Text>
            <Text style={S.college} numberOfLines={1}>{collegeName}</Text>
          </View>
          <View style={S.roleBadge}>
            <Ionicons name="school-outline" size={14} color={Colors.accent} />
            <Text style={S.roleBadgeText}>Faculty</Text>
          </View>
        </View>

        {error ? (
          <View style={S.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text style={S.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Stats grid */}
        <Text style={S.sectionTitle}>Overview</Text>
        {loading ? (
          <View style={S.statsGrid}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} style={S.statCardSkel} />)}
          </View>
        ) : (
          <View style={S.statsGrid}>
            <StatCard label="Total Students"  value={stats?.totalStudents ?? 0}  icon="people-outline"      color={Colors.accent}   />
            <StatCard label="Verified"         value={stats?.verifiedStudents ?? 0} icon="shield-checkmark-outline" color={Colors.success} />
            <StatCard label="Active This Week" value={stats?.activeThisWeek ?? 0} icon="pulse-outline"       color={Colors.warning}  />
            <StatCard label="Avg XP"           value={stats?.avgXP ?? 0}          icon="star-outline"        color={Colors.accentLight} />
          </View>
        )}

        {/* Top students */}
        <Row style={S.sectionRow}>
          <Text style={S.sectionTitle}>Top Students</Text>
          <Pressable onPress={() => router.push('/(faculty-tabs)/students')} hitSlop={8}>
            <Text style={S.seeAll}>See all</Text>
          </Pressable>
        </Row>

        <Card style={S.listCard}>
          {loading ? (
            [0,1,2].map(i => <Skeleton key={i} style={S.skelRow} />)
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

        {/* Department breakdown */}
        {!loading && stats?.topDepartments && stats.topDepartments.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Departments</Text>
            <Card style={S.listCard}>
              {stats.topDepartments.map((dept, i) => (
                <View key={dept.name}>
                  <Row style={S.deptRow}>
                    <Text style={S.deptName}>{dept.name}</Text>
                    <Text style={S.deptCount}>{dept.count} students</Text>
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

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg1 },
  scroll: { paddingHorizontal: Layout.screenPadding, gap: Spacing.md },

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

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.status.dangerBg,
    borderColor: Colors.status.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: { ...Typography.bodySm, color: Colors.danger, flex: 1 },

  sectionTitle: { ...Typography.h4, color: Colors.text1, marginTop: Spacing.xs },
  sectionRow:   { justifyContent: 'space-between', alignItems: 'center' },
  seeAll:       { ...Typography.bodySm, color: Colors.accent },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  statCard: {
    ...Surface.card,
    width: '47.5%',
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  statCardSkel: { width: '47.5%', height: 88 },
  statIcon: {
    width: 32, height: 32, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: { ...Typography.statSm, color: Colors.text0 },
  statLabel: { ...Typography.bodyXs, color: Colors.text3 },

  listCard: { ...Surface.card, padding: 0, overflow: 'hidden' },
  divider:  { height: 1, backgroundColor: Colors.border0, marginHorizontal: Spacing.md },
  skelRow:  { height: 56, margin: Spacing.md, borderRadius: Radius.sm },

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
    backgroundColor: Colors.accentDim, borderRadius: Radius.xs,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  xpText: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' },

  deptRow:  { padding: Spacing.md, justifyContent: 'space-between' },
  deptName: { ...Typography.uiSm, color: Colors.text1 },
  deptCount:{ ...Typography.bodySm, color: Colors.text3 },

  empty: { alignItems: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  emptyText: { ...Typography.bodySm, color: Colors.text4 },
});
