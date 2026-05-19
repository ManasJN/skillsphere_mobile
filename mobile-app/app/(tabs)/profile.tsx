import AsyncStorage from '@react-native-async-storage/async-storage';
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

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';
import { Colors, Radius, Typography } from '@/lib/theme';
import { Avatar, Badge, Card, Divider, EmptyState, Row, StatChip } from '@/components/ui';

type User = {
  _id?: string; name?: string; email?: string; role?: string; department?: string;
  semester?: number | string; rollNumber?: string; cgpa?: number | string;
  xpPoints?: number; level?: number; streakDays?: number; batch?: string;
  verificationStatus?: string; college?: string; collegeId?: { collegeName?: string };
  codingStats?: Record<string, number>; socialLinks?: Record<string, string>;
};

function getInitials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'SS';
}

function levelFromXP(xp: number) { return Math.floor(xp / 500) + 1; }
function xpProgress(xp: number) {
  const lv = levelFromXP(xp);
  return Math.round(((xp - (lv - 1) * 500) / 500) * 100);
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await authAPI.me();
      setUser(res.data.user ?? res.data.data ?? res.data);
    } catch { setError('Could not load profile.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace('/login');
  };

  const xp = user?.xpPoints ?? 0;
  const level = levelFromXP(xp);
  const progress = xpProgress(xp);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl colors={[Colors.accent]} onRefresh={onRefresh} refreshing={refreshing} tintColor={Colors.accent} />
        }
        showsVerticalScrollIndicator={false}>

        {/* Header row */}
        <Row style={styles.headerRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={10}>
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </Row>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}><Text style={styles.errorMsg}>{error}</Text></View>
        ) : (
          <>
            {/* ── Identity Card ── */}
            <View style={styles.identityCard}>
              <View style={styles.identityTop}>
                <Avatar initials={getInitials(user?.name)} size={62} />
                <View style={styles.identityCopy}>
                  <Text style={styles.userName}>{user?.name ?? 'Student'}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                  <Row style={{ gap: 6, marginTop: 4 }}>
                    <Badge
                      label={user?.role ?? 'student'}
                      color={user?.role === 'faculty' ? 'indigo' : 'teal'}
                    />
                    {user?.verificationStatus === 'verified' && (
                      <Badge label="Verified" color="green" />
                    )}
                  </Row>
                </View>
              </View>

              {/* XP bar inside identity card */}
              <View style={styles.xpRow}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Row style={styles.xpMeta}>
                    <Text style={styles.levelLabel}>Level {level}</Text>
                    <Text style={styles.xpValue}>{xp.toLocaleString()} XP</Text>
                  </Row>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.xpNext}>{progress}% to Level {level + 1}</Text>
                </View>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakFire}>🔥</Text>
                  <Text style={styles.streakNum}>{user?.streakDays ?? 0}</Text>
                  <Text style={styles.streakLabel}>day streak</Text>
                </View>
              </View>
            </View>

            {/* ── Quick Stats ── */}
            <Row style={styles.statsRow}>
              <StatChip label="CGPA" value={String(user?.cgpa ?? '–')} />
              <StatChip label="Semester" value={`Sem ${user?.semester ?? '–'}`} />
              <StatChip label="Streak" value={`${user?.streakDays ?? 0}d`} accent />
            </Row>

            {/* ── Academic Info ── */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Academic Info</Text>
              <Divider style={{ marginVertical: 4 }} />
              {[
                ['Department', user?.department],
                ['Roll Number', user?.rollNumber],
                ['Batch', user?.batch],
                ['College', user?.collegeId?.collegeName ?? user?.college],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <Row key={String(label)} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{String(value)}</Text>
                  </Row>
                ))}
              {!user?.department && !user?.rollNumber && (
                <EmptyState title="No academic info yet" body="Update your profile to fill in these details." />
              )}
            </Card>

            {/* ── Coding Profile ── */}
            {user?.codingStats && Object.keys(user.codingStats).length > 0 && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Coding Stats</Text>
                <Divider style={{ marginVertical: 4 }} />
                <View style={styles.codingGrid}>
                  {[
                    ['Easy',    user.codingStats.leetcodeEasy,          Colors.low],
                    ['Medium',  user.codingStats.leetcodeMedium,        Colors.medium],
                    ['Hard',    user.codingStats.leetcodeHard,          Colors.high],
                    ['CF Rating', user.codingStats.codeforcesRating,    Colors.xp],
                    ['GitHub',  user.codingStats.githubContributions,   Colors.accent],
                    ['Contests',user.codingStats.contestsParticipated,  Colors.accentText],
                  ]
                    .filter(([, v]) => v !== undefined && v !== null)
                    .map(([label, value, color]) => (
                      <View key={String(label)} style={styles.codingCell}>
                        <Text style={[styles.codingValue, { color: String(color) }]}>{String(value)}</Text>
                        <Text style={styles.codingLabel}>{String(label)}</Text>
                      </View>
                    ))}
                </View>
              </Card>
            )}

            {/* ── Social Links ── */}
            {user?.socialLinks && Object.values(user.socialLinks).some(Boolean) && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Social Links</Text>
                <Divider style={{ marginVertical: 4 }} />
                {Object.entries(user.socialLinks)
                  .filter(([, v]) => v)
                  .map(([platform, link]) => (
                    <Row key={platform} style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{platform}</Text>
                      <Text style={styles.linkValue} numberOfLines={1}>
                        {String(link).replace(/^https?:\/\//, '')}
                      </Text>
                    </Row>
                  ))}
              </Card>
            )}

            {/* ── Danger zone ── */}
            <Pressable onPress={handleLogout} style={styles.logoutCard}>
              <Text style={styles.logoutCardText}>Sign out of SkillSphere</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 14, paddingBottom: 48, paddingHorizontal: 18, paddingTop: 20 },

  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { color: Colors.text0, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  logoutBtn: { paddingHorizontal: 2, paddingVertical: 4 },
  logoutText: { ...Typography.uiSm, color: Colors.text3 },

  loadingWrap: { alignItems: 'center', gap: 14, paddingVertical: 60 },
  loadingText: { ...Typography.body, color: Colors.text3 },
  errorBox: {
    backgroundColor: '#1C0000', borderColor: '#4C0519', borderRadius: Radius.sm,
    borderWidth: 1, padding: 16,
  },
  errorMsg: { ...Typography.bodySm, color: Colors.danger, textAlign: 'center' },

  // Identity card
  identityCard: {
    backgroundColor: Colors.bg2, borderColor: Colors.border1, borderRadius: Radius.xl,
    borderWidth: 1, gap: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  identityTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 16 },
  identityCopy: { flex: 1, gap: 4 },
  userName: { color: Colors.text0, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  userEmail: { ...Typography.bodySm, color: Colors.text3 },

  // XP bar
  xpRow: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  xpMeta: { justifyContent: 'space-between' },
  levelLabel: { ...Typography.label, color: Colors.xp, fontSize: 10 },
  xpValue: { color: Colors.text0, fontSize: 15, fontWeight: '800' },
  progressTrack: {
    backgroundColor: Colors.bg4, borderRadius: Radius.full, height: 7, overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: Colors.accent, borderRadius: Radius.full, height: '100%',
  },
  xpNext: { ...Typography.bodySm, color: Colors.text3 },
  streakBadge: {
    alignItems: 'center', backgroundColor: Colors.bg4, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1, gap: 2, padding: 12, minWidth: 72,
  },
  streakFire: { fontSize: 22 },
  streakNum: { color: Colors.text0, fontSize: 22, fontWeight: '800' },
  streakLabel: { ...Typography.bodySm, color: Colors.text3 },

  statsRow: { gap: 10 },

  // Sections
  section: { gap: 12 },
  sectionTitle: { ...Typography.h3, color: Colors.text0 },
  infoRow: { justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },
  infoValue: { ...Typography.bodySm, color: Colors.text1, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  linkValue: { ...Typography.bodySm, color: Colors.accentText, maxWidth: '60%', textAlign: 'right' },

  // Coding
  codingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  codingCell: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1, gap: 4, padding: 14, width: '31%',
  },
  codingValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  codingLabel: { ...Typography.bodySm, color: Colors.text3, textAlign: 'center' },

  // Logout card
  logoutCard: {
    alignItems: 'center', backgroundColor: '#0E0204', borderColor: '#3B0A14',
    borderRadius: Radius.md, borderWidth: 1, justifyContent: 'center', padding: 16, marginTop: 8,
  },
  logoutCardText: { ...Typography.ui, color: '#F87171' },
});
