import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOKEN_STORAGE_KEY, authAPI, skillsAPI, goalsAPI, projectsAPI } from '@/lib/api';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/lib/theme';
import { Avatar, Badge, Card, Divider, EmptyState, ErrorBanner, ProgressBar, Row, Skeleton, StatChip } from '@/components/ui';
import { getInitials, levelFromXP, xpProgress, type User } from '@/hooks/useUser';

type Skill   = { _id?: string; name?: string; category?: string; level?: number };
type Goal    = { _id?: string; title?: string; priority?: string; progress?: number; status?: string; deadline?: string };
type Project = { _id?: string; title?: string; status?: string; techStack?: string[]; description?: string };

function fmtDate(d?: string) {
  if (!d) return '–';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
}

function skillColor(cat = '') {
  return (Colors.skill as Record<string, string>)[cat] ?? Colors.skill.default;
}

function statusBadge(s?: string): Parameters<typeof Badge>[0]['color'] {
  return ({ completed:'green', ongoing:'teal', planned:'indigo', abandoned:'red', active:'teal' } as const)[s ?? ''] ?? 'muted';
}

export default function ProfileScreen() {
  const [user,     setUser]     = useState<User | null>(null);
  const [skills,   setSkills]   = useState<Skill[]>([]);
  const [goals,    setGoals]    = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState<'skills' | 'goals' | 'projects'>('skills');

  const load = useCallback(async () => {
    setError('');
    try {
      const [meRes, skillsRes, goalsRes, projRes] = await Promise.all([
        authAPI.me(),
        skillsAPI.getMine(),
        goalsAPI.getMine(),
        projectsAPI.getMine(),
      ]);
      setUser(meRes.data.user ?? meRes.data.data ?? meRes.data);
      setSkills(skillsRes.data.data ?? []);
      setGoals(goalsRes.data.data ?? []);
      setProjects(projRes.data.data ?? []);
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

  const xp       = user?.xpPoints ?? 0;
  const level    = levelFromXP(xp);
  const progress = xpProgress(xp);
  const cs       = user?.codingStats ?? {};

  const TABS = [
    { key: 'skills'   as const, label: `Skills (${skills.length})` },
    { key: 'goals'    as const, label: `Goals (${goals.length})` },
    { key: 'projects' as const, label: `Projects (${projects.length})` },
  ];

  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <ScrollView
        contentContainerStyle={S.content}
        refreshControl={<RefreshControl colors={[Colors.accent]} onRefresh={onRefresh} refreshing={refreshing} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}>

        {/* ── Header row ── */}
        <Row style={S.headerRow}>
          <Text style={S.screenTitle}>Profile</Text>
          <Pressable onPress={handleLogout} hitSlop={12} style={S.signOutBtn}>
            <Text style={S.signOutTxt}>Sign out</Text>
          </Pressable>
        </Row>

        {loading ? <ProfileSkeleton /> : error ? <ErrorBanner message={error} /> : (
          <>
            {/* ── Identity Hero Card ── */}
            <View style={S.heroCard}>
              <View style={S.heroGlow} />
              <Row style={S.heroTop}>
                <Avatar initials={getInitials(user?.name)} size={68} />
                <View style={S.heroCopy}>
                  <Text style={S.heroName}>{user?.name ?? 'Student'}</Text>
                  <Text style={S.heroEmail}>{user?.email}</Text>
                  <Row style={{ gap: 6, marginTop: 6 }}>
                    <Badge label={user?.role ?? 'student'} color={user?.role === 'faculty' ? 'indigo' : 'teal'} />
                    {user?.verificationStatus === 'verified' && <Badge label="✓ Verified" color="green" />}
                  </Row>
                </View>
              </Row>

              {/* XP bar */}
              <View style={S.xpSection}>
                <Row style={S.xpMeta}>
                  <Text style={S.levelLbl}>LEVEL {level}</Text>
                  <Text style={S.xpVal}>{xp.toLocaleString()} XP</Text>
                </Row>
                <ProgressBar pct={progress} color={Colors.accent} height={8} />
                <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={S.xpSub}>{progress}% to Level {level + 1}</Text>
                  <Text style={S.xpSub}>🔥 {user?.streakDays ?? 0} day streak</Text>
                </Row>
              </View>
            </View>

            {/* ── Quick Stats ── */}
            <Row style={S.statsRow}>
              <StatChip label="CGPA" value={String(user?.cgpa ?? '–')} />
              <StatChip label={`Sem ${user?.semester ?? '–'}`} value={user?.department?.slice(0, 6) ?? 'Dept'} />
              <StatChip label="Streak" value={`${user?.streakDays ?? 0}d`} accent />
            </Row>

            {/* ── Academic Info ── */}
            <Card style={S.section}>
              <Text style={S.sectionTitle}>Academic Details</Text>
              <Divider style={{ marginVertical: 8 }} />
              {[
                ['Department',   user?.department],
                ['Roll Number',  user?.rollNumber],
                ['Batch',        user?.batch],
                ['Section',      (user as any)?.section],
                ['Aspiration',   (user as any)?.aspiration],
                ['College',      user?.collegeId?.collegeName ?? user?.college],
              ]
                .filter(([, v]) => v)
                .map(([lbl, val]) => (
                  <Row key={String(lbl)} style={S.infoRow}>
                    <Text style={S.infoLbl}>{lbl}</Text>
                    <Text style={S.infoVal}>{String(val)}</Text>
                  </Row>
                ))}
              {!user?.department && !user?.rollNumber && (
                <EmptyState title="No academic info" body="Ask your admin to update your profile details." />
              )}
            </Card>

            {/* ── Coding Stats ── */}
            {Object.keys(cs).length > 0 && (
              <Card style={S.section}>
                <Text style={S.sectionTitle}>Coding Profile</Text>
                <Divider style={{ marginVertical: 8 }} />
                <View style={S.codingGrid}>
                  {[
                    ['Solved',   cs.leetcodeSolved,     Colors.accentLight],
                    ['Easy',     cs.leetcodeEasy,       Colors.success],
                    ['Medium',   cs.leetcodeMedium,     Colors.warning],
                    ['Hard',     cs.leetcodeHard,       Colors.danger],
                    ['CF Rating',cs.codeforcesRating,   Colors.xp],
                    ['GitHub',   cs.githubContributions,Colors.info],
                    ['Repos',    cs.githubRepos,        Colors.text2],
                    ['Contests', cs.contestsParticipated,Colors.xpLight],
                  ]
                    .filter(([, v]) => v !== undefined && v !== null)
                    .map(([lbl, val, clr]) => (
                      <View key={String(lbl)} style={S.codingCell}>
                        <Text style={[S.codingVal, { color: String(clr) }]}>{String(val)}</Text>
                        <Text style={S.codingLbl}>{String(lbl)}</Text>
                      </View>
                    ))}
                </View>
              </Card>
            )}

            {/* ── Social Links ── */}
            {user?.socialLinks && Object.values(user.socialLinks).some(Boolean) && (
              <Card style={S.section}>
                <Text style={S.sectionTitle}>Links</Text>
                <Divider style={{ marginVertical: 8 }} />
                {Object.entries(user.socialLinks).filter(([, v]) => v).map(([platform, link]) => (
                  <Row key={platform} style={S.infoRow}>
                    <Text style={S.infoLbl}>{platform}</Text>
                    <Text style={S.linkVal} numberOfLines={1}>{String(link).replace(/^https?:\/\//, '')}</Text>
                  </Row>
                ))}
              </Card>
            )}

            {/* ── Tabbed Content ── */}
            <Card style={S.tabCard}>
              {/* Tab bar */}
              <View style={S.tabBar}>
                {TABS.map(t => (
                  <Pressable key={t.key} onPress={() => setTab(t.key)} style={[S.tabBtn, tab === t.key && S.tabBtnActive]}>
                    <Text style={[S.tabTxt, tab === t.key && S.tabTxtActive]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Skills */}
              {tab === 'skills' && (
                skills.length === 0
                  ? <EmptyState emoji="🎯" title="No skills tracked" body="Skills you add will show up here." />
                  : <View style={S.skillsGrid}>
                      {skills.map((sk, i) => (
                        <View key={i} style={S.skillRow}>
                          <View style={[S.skillDot, { backgroundColor: skillColor(sk.category) }]} />
                          <View style={{ flex: 1, gap: 5 }}>
                            <Row style={{ justifyContent: 'space-between' }}>
                              <Text style={S.skillName}>{sk.name}</Text>
                              <Text style={[S.skillPct, { color: skillColor(sk.category) }]}>{sk.level ?? 0}%</Text>
                            </Row>
                            <ProgressBar pct={sk.level ?? 0} color={skillColor(sk.category)} height={5} />
                          </View>
                        </View>
                      ))}
                    </View>
              )}

              {/* Goals */}
              {tab === 'goals' && (
                goals.length === 0
                  ? <EmptyState emoji="🏁" title="No goals yet" body="Set goals with deadlines and track your progress." />
                  : <View style={{ gap: 10 }}>
                      {goals.map((g, i) => (
                        <View key={i} style={S.goalRow}>
                          <Row style={S.goalTop}>
                            <Text style={S.goalTitle} numberOfLines={1}>{g.title}</Text>
                            <Badge label={g.status ?? 'active'} color={statusBadge(g.status)} />
                          </Row>
                          <ProgressBar pct={g.progress ?? 0} color={
                            ({ high: Colors.danger, medium: Colors.warning, low: Colors.success } as const)[g.priority ?? ''] ?? Colors.accent
                          } height={5} />
                          <Row style={{ justifyContent: 'space-between' }}>
                            <Text style={S.goalMeta}>{g.progress ?? 0}% done</Text>
                            <Text style={S.goalMeta}>Due {fmtDate(g.deadline)}</Text>
                          </Row>
                        </View>
                      ))}
                    </View>
              )}

              {/* Projects */}
              {tab === 'projects' && (
                projects.length === 0
                  ? <EmptyState emoji="🚀" title="No projects yet" body="Add your projects to build your portfolio." />
                  : <View style={{ gap: 10 }}>
                      {projects.map((p, i) => (
                        <View key={i} style={S.projRow}>
                          <Row style={S.projTop}>
                            <Text style={S.projTitle} numberOfLines={1}>{p.title}</Text>
                            <Badge label={p.status ?? 'planned'} color={statusBadge(p.status)} />
                          </Row>
                          {p.description && <Text style={S.projDesc} numberOfLines={2}>{p.description}</Text>}
                          {(p.techStack?.length ?? 0) > 0 && (
                            <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                              {p.techStack!.slice(0, 5).map(t => (
                                <View key={t} style={S.tag}><Text style={S.tagTxt}>{t}</Text></View>
                              ))}
                            </Row>
                          )}
                        </View>
                      ))}
                    </View>
              )}
            </Card>

            {/* ── Sign out ── */}
            <Pressable onPress={handleLogout} style={S.logoutCard}>
              <Text style={S.logoutTxt}>Sign out of SkillSphere</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <View style={[S.heroCard, { gap: 16 }]}>
        <Row style={{ gap: 16 }}>
          <Skeleton width={68} height={68} radius={19} />
          <View style={{ flex: 1, gap: 10 }}>
            <Skeleton height={18} width="60%" />
            <Skeleton height={12} width="75%" />
          </View>
        </Row>
        <Skeleton height={8} />
      </View>
      <Row style={{ gap: 10 }}>
        <Skeleton height={64} radius={12} style={{ flex: 1 }} />
        <Skeleton height={64} radius={12} style={{ flex: 1 }} />
        <Skeleton height={64} radius={12} style={{ flex: 1 }} />
      </Row>
      <Skeleton height={120} radius={16} />
    </View>
  );
}

const S = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 14, paddingBottom: 48, paddingHorizontal: 18, paddingTop: 20 },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { color: Colors.text0, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  signOutBtn: { paddingHorizontal: 2, paddingVertical: 4 },
  signOutTxt: { ...Typography.uiSm, color: Colors.text3 },

  // Hero card
  heroCard: {
    backgroundColor: Colors.bg2, borderColor: Colors.border1, borderRadius: Radius.xxl,
    borderWidth: 1, gap: 20, overflow: 'hidden', padding: 20, ...Shadow.md,
  },
  heroGlow: { backgroundColor: Colors.accent, borderRadius: 80, height: 120, opacity: 0.05, position: 'absolute', right: -40, top: -40, width: 120 },
  heroTop: { gap: 16, alignItems: 'flex-start' },
  heroCopy: { flex: 1, gap: 4 },
  heroName: { color: Colors.text0, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  heroEmail: { ...Typography.bodySm, color: Colors.text3 },

  xpSection: { gap: 8 },
  xpMeta: { justifyContent: 'space-between' },
  levelLbl: { ...Typography.label, color: Colors.xpLight, fontSize: 10 },
  xpVal: { color: Colors.text0, fontSize: 16, fontWeight: '800' },
  xpSub: { ...Typography.bodySm, color: Colors.text3 },

  statsRow: { gap: 10 },

  section: { gap: 12 },
  sectionTitle: { ...Typography.h3, color: Colors.text0 },
  infoRow: { justifyContent: 'space-between', paddingVertical: 5 },
  infoLbl: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },
  infoVal: { ...Typography.bodySm, color: Colors.text1, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  linkVal: { ...Typography.bodySm, color: Colors.accentLight, maxWidth: '55%', textAlign: 'right' },

  codingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  codingCell: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1, gap: 4, padding: 12, width: '23%',
  },
  codingVal: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  codingLbl: { ...Typography.bodySm, color: Colors.text3, textAlign: 'center', fontSize: 10 },

  // Tabs
  tabCard: { gap: 16 },
  tabBar: { backgroundColor: Colors.bg3, borderRadius: Radius.sm, flexDirection: 'row', padding: 4 },
  tabBtn: { alignItems: 'center', borderRadius: Radius.xs, flex: 1, paddingVertical: 8 },
  tabBtnActive: { backgroundColor: Colors.bg2, ...Shadow.sm },
  tabTxt: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },
  tabTxtActive: { color: Colors.text0, fontWeight: '700' },

  skillsGrid: { gap: 12 },
  skillRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  skillDot: { borderRadius: 5, height: 8, width: 8 },
  skillName: { ...Typography.uiSm, color: Colors.text1, flex: 1 },
  skillPct: { ...Typography.mono, fontWeight: '700' },

  goalRow: {
    backgroundColor: Colors.bg3, borderColor: Colors.border0, borderRadius: Radius.md,
    borderWidth: 1, gap: 8, padding: 14,
  },
  goalTop: { gap: 10, justifyContent: 'space-between' },
  goalTitle: { ...Typography.h4, color: Colors.text0, flex: 1 },
  goalMeta: { ...Typography.bodySm, color: Colors.text3 },

  projRow: {
    backgroundColor: Colors.bg3, borderColor: Colors.border0, borderRadius: Radius.md,
    borderWidth: 1, gap: 8, padding: 14,
  },
  projTop: { gap: 10, justifyContent: 'space-between' },
  projTitle: { ...Typography.h4, color: Colors.text0, flex: 1 },
  projDesc: { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  tag: { backgroundColor: Colors.bg4, borderColor: Colors.border1, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  tagTxt: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },

  logoutCard: {
    alignItems: 'center', backgroundColor: '#0A0205', borderColor: '#3B0A14',
    borderRadius: Radius.md, borderWidth: 1, justifyContent: 'center', marginTop: 6, padding: 16,
  },
  logoutTxt: { ...Typography.ui, color: Colors.danger },
});
