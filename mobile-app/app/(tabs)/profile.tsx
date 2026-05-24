import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOKEN_STORAGE_KEY, authAPI, skillsAPI, projectsAPI, achievementsAPI } from '@/lib/api';
import { Colors, NAV_BOTTOM_OFFSET, Radius, Shadow, Typography } from '@/lib/theme';
import { Avatar, Badge, Card, Divider, EmptyState, ErrorBanner, ProgressBar, Row, Skeleton, StatChip } from '@/components/ui';
import { getInitials, levelFromXP, xpProgress, type User } from '@/hooks/useUser';
import { AchievementsRow } from '@/components/AchievementsRow';
import { SkillSheet }      from '@/components/SkillSheet';
import { streakHealth, xpToNextLevel } from '@/hooks/useProductivity';

type Skill   = { _id?: string; name?: string; category?: string; level?: number };
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,    setError]    = useState('');
  const [tab,          setTab]         = useState<'skills' | 'projects'>('skills');
  const [achievements, setAchievements] = useState<any[]>([]);
  const [achLoading,   setAchLoading]   = useState(false);
  const [skillSheet,   setSkillSheet]   = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [meRes, skillsRes, projRes] = await Promise.all([
        authAPI.me(),
        skillsAPI.getMine(),
        projectsAPI.getMine(),
      ]);
      setUser(meRes.data.user ?? meRes.data.data ?? meRes.data);
      setSkills(skillsRes.data.data ?? []);
      setProjects(projRes.data.data ?? []);
      // Achievements loaded separately — non-blocking
      setAchLoading(true);
      achievementsAPI.getMine().then(r => setAchievements(r.data.data ?? [])).catch(() => {}).finally(() => setAchLoading(false));
    } catch { setError('Could not load profile.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const openAddSkill = () => { setEditingSkill(null); setSkillSheet(true); };
  const openEditSkill = (sk: Skill) => { setEditingSkill(sk); setSkillSheet(true); };

  const handleSaveSkill = async (draft: { name: string; category: string; level: number; description?: string }) => {
    if (editingSkill?._id) {
      await skillsAPI.update(editingSkill._id, draft as Record<string, unknown>);
    } else {
      await skillsAPI.create(draft as Record<string, unknown>);
    }
    load(); // reload to get server-assigned _id on new skills
  };

  const handleDeleteSkill = (sk: Skill) => {
    if (!sk._id) return;
    const { Alert } = require('react-native');
    Alert.alert(
      'Remove skill',
      `Remove "${sk.name}" from your profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          setDeletingSkillId(sk._id!);
          try { await skillsAPI.delete(sk._id!); setSkills(prev => prev.filter(s => s._id !== sk._id)); }
          catch { /* silent */ }
          finally { setDeletingSkillId(null); }
        }},
      ]
    );
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace('/login');
  };

  const xp       = user?.xpPoints ?? 0;
  const level    = levelFromXP(xp);
  const progress = xpProgress(xp);
  const toNext   = xpToNextLevel(xp);
  const sHealth  = streakHealth(user?.streakDays ?? 0, (user as any)?.lastActiveAt);
  const cs       = user?.codingStats ?? {};

  const TABS = [
    { key: 'skills'   as const, label: `Skills (${skills.length})` },
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
                  <Text style={S.xpSub}>{toNext} XP to Level {level + 1}</Text>
                  <Text style={[S.xpSub, sHealth === 'at_risk' && { color: Colors.warning }, sHealth === 'broken' && { color: Colors.danger }]}>{user?.streakDays ?? 0} day streak{sHealth === 'at_risk' ? ' — at risk' : ''}</Text>
                </Row>
              </View>
            </View>

            {/* ── Quick Stats ── */}
            <Row style={S.statsRow}>
              <StatChip label="CGPA"   value={String(user?.cgpa ?? '–')} />
              <StatChip label="Skills" value={String(skills.length)} />
              <StatChip label="Streak" value={`${user?.streakDays ?? 0}d`} accent={sHealth === 'safe' && (user?.streakDays ?? 0) > 1} />
            </Row>

            {/* ── Achievements ── */}
            {(achLoading || achievements.length > 0) && (
              <AchievementsRow achievements={achievements} loading={achLoading} />
            )}

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
                    ['CF Rating',cs.codeforcesRating,   Colors.accent],
                    ['GitHub',   cs.githubContributions,Colors.info],
                    ['Repos',    cs.githubRepos,        Colors.text2],
                    ['Contests', cs.contestsParticipated,Colors.accentLight],
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

            {/* ── Goals nudge ── */}
            <Pressable onPress={() => router.push('/(tabs)/goals')} style={S.goalsNudge}>
              <View>
                <Text style={S.goalsNudgeTitle}>Goals</Text>
                <Text style={S.goalsNudgeSub}>Track progress toward your targets</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
            </Pressable>

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
                <View style={{ gap: 10 }}>
                  {skills.length === 0
                    ? <EmptyState title="No skills yet" body="Track what you know and what you're learning." />
                    : skills.map((sk, i) => (
                        <View key={sk._id ?? i} style={S.skillRow}>
                          <View style={[S.skillDot, { backgroundColor: skillColor(sk.category) }]} />
                          <View style={{ flex: 1, gap: 5 }}>
                            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={S.skillName} numberOfLines={1}>{sk.name}</Text>
                              <Row style={{ gap: 8, alignItems: 'center' }}>
                                <Text style={[S.skillPct, { color: skillColor(sk.category) }]}>{sk.level ?? 0}%</Text>
                                <Pressable onPress={() => openEditSkill(sk)} hitSlop={8}>
                                  <Ionicons name="create-outline" size={15} color={Colors.text3} />
                                </Pressable>
                                <Pressable onPress={() => handleDeleteSkill(sk)} hitSlop={8}
                                  disabled={deletingSkillId === sk._id}>
                                  <Ionicons name="trash-outline" size={15}
                                    color={deletingSkillId === sk._id ? Colors.text4 : Colors.text3} />
                                </Pressable>
                              </Row>
                            </Row>
                            <ProgressBar pct={sk.level ?? 0} color={skillColor(sk.category)} height={5} />
                          </View>
                        </View>
                      ))
                  }
                  {/* Add skill button — always visible at bottom of list */}
                  <Pressable onPress={openAddSkill} style={S.addSkillBtn}>
                    <Ionicons name="add" size={16} color={Colors.accent} />
                    <Text style={S.addSkillTxt}>Add skill</Text>
                  </Pressable>
                </View>
              )}

              {/* Goals — managed from the Goals tab */}

              {/* Projects */}
              {tab === 'projects' && (
                projects.length === 0
                  ? <EmptyState title="No projects yet" body="Add projects to showcase your work and earn XP." />
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
      <SkillSheet
        visible={skillSheet}
        onClose={() => setSkillSheet(false)}
        onSave={handleSaveSkill}
        skill={editingSkill}
      />
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
  content: { gap: 14, paddingBottom: NAV_BOTTOM_OFFSET + 20, paddingHorizontal: 18, paddingTop: 20 },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { ...Typography.h2, color: Colors.text0 },
  signOutBtn: { paddingHorizontal: 2, paddingVertical: 4 },
  signOutTxt: { ...Typography.uiSm, color: Colors.text3 },

  // Hero card
  heroCard: {
    backgroundColor: Colors.accentDim, borderColor: Colors.accentMid, borderRadius: Radius.lg,
    borderLeftWidth: 3, borderLeftColor: Colors.accent,
    borderWidth: 1, gap: 16, overflow: 'hidden', padding: 16,
  },
  heroGlow: {},
  heroTop: { gap: 16, alignItems: 'flex-start' },
  heroCopy: { flex: 1, gap: 4 },
  heroName: { ...Typography.h2, color: Colors.text0 },
  heroEmail: { ...Typography.bodySm, color: Colors.text3 },

  xpSection: { gap: 8 },
  xpMeta: { justifyContent: 'space-between' },
  levelLbl: { ...Typography.label, color: Colors.accentLight, fontSize: 10 },
  xpVal: { ...Typography.h4, color: Colors.text0 },
  xpSub: { ...Typography.bodySm, color: Colors.text3 },

  statsRow: { gap: 10 },

  section: { gap: 12 },
  sectionTitle: { ...Typography.h3, color: Colors.text0 },
  infoRow: { justifyContent: 'space-between', paddingVertical: 5 },
  infoLbl: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' as const },
  infoVal: { ...Typography.bodySm, color: Colors.text1, fontWeight: '600' as const, maxWidth: '55%', textAlign: 'right' as const },
  linkVal: { ...Typography.bodySm, color: Colors.accentLight, maxWidth: '55%', textAlign: 'right' },

  codingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  codingCell: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1, gap: 4, padding: 12, width: '23%',
  },
  codingVal: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  codingLbl: { ...Typography.bodySm, color: Colors.text3, textAlign: 'center', fontSize: 10 },

  // Tabs
  tabCard: { gap: 16 },
  tabBar: { backgroundColor: Colors.bg3, borderRadius: Radius.sm, flexDirection: 'row', padding: 4 },
  tabBtn: { alignItems: 'center', borderRadius: Radius.xs, flex: 1, paddingVertical: 8 },
  tabBtnActive: { backgroundColor: Colors.bg2, ...Shadow.sm },
  tabTxt: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' as const },
  tabTxtActive: { color: Colors.text0, fontWeight: '700' as const },

  skillsGrid: { gap: 12 },
  skillRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  skillDot: { borderRadius: 5, height: 8, width: 8 },
  skillName: { ...Typography.uiSm, color: Colors.text1, flex: 1 },
  skillPct: { ...Typography.mono, fontWeight: '700' as const },


  projRow: {
    backgroundColor: Colors.bg3, borderColor: Colors.border0, borderRadius: Radius.md,
    borderWidth: 1, gap: 8, padding: 14,
  },
  projTop: { gap: 10, justifyContent: 'space-between' },
  projTitle: { ...Typography.h4, color: Colors.text0, flex: 1 },
  projDesc: { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  tag: { backgroundColor: Colors.bg4, borderColor: Colors.border1, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  tagTxt: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' as const },

  goalsNudge: {
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  goalsNudgeTitle: { ...Typography.h4, color: Colors.text0, marginBottom: 3 },
  goalsNudgeSub:   { ...Typography.bodySm, color: Colors.text3 },

  addSkillBtn: {
    alignItems: 'center',
    borderColor: Colors.border1,
    borderRadius: Radius.sm,
    borderStyle: 'dashed' as const,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  addSkillTxt: { ...Typography.uiSm, color: Colors.accent },

  logoutCard: {
    alignItems: 'center', backgroundColor: '#1A0808', borderColor: '#3D1010',
    borderRadius: Radius.md, borderWidth: 1, justifyContent: 'center', marginTop: 6, padding: 16,
  },
  logoutTxt: { ...Typography.ui, color: Colors.danger },
});
