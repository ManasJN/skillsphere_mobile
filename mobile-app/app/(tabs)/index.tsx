import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  analyticsAPI, authAPI, collegesAPI, goalsAPI,
  opportunitiesAPI, projectsAPI, recommendationsAPI, skillsAPI,
} from '@/lib/api';
import { Colors, Radius, Shadow, Typography } from '@/lib/theme';
import {
  Avatar, Badge, Card, Divider, EmptyState, ErrorBanner,
  ProgressBar, Row, SectionHeader, Skeleton, SkeletonCard, StatChip,
} from '@/components/ui';
import { getInitials, levelFromXP, xpProgress } from '@/hooks/useUser';

// ─── Types ────────────────────────────────────────────────────────────────────
type User = {
  name?: string; xpPoints?: number; streakDays?: number; cgpa?: number|string;
  codingStats?: Record<string,number>; verificationStatus?: string;
  collegeId?: { collegeName?: string }; college?: string;
};
type Skill   = { name?: string; category?: string; level?: number };
type Goal    = { title?: string; priority?: string; progress?: number; deadline?: string; status?: string };
type Project = { title?: string; status?: string; techStack?: string[] };
type Stats   = { totalSkills: number; activeGoals: number; completedGoals: number; totalProjects: number; goalCompletionRate: number };
type Opp     = { _id: string; title?: string; type?: string; company?: string; matchScore?: number; deadline?: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
function fmtDate(d?: string) {
  if (!d) return '–';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(d));
}
function priorityColor(p?: string): string {
  return ({ high: Colors.danger, medium: Colors.warning, low: Colors.success }[p ?? ''] ?? Colors.text3);
}
function skillColor(cat?: string): string {
  return (Colors.skill as Record<string, string>)[cat ?? ''] ?? Colors.skill.default;
}
function statusBadge(s?: string): Parameters<typeof Badge>[0]['color'] {
  return ({ completed:'green', ongoing:'teal', planned:'indigo', abandoned:'red' } as const)[s ?? ''] ?? 'muted';
}
function oppBadge(t?: string): Parameters<typeof Badge>[0]['color'] {
  return ({ internship:'teal', hackathon:'indigo', job:'green', research:'blue', scholarship:'amber' } as const)[t ?? ''] ?? 'muted';
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [user,    setUser]    = useState<User|null>(null);
  const [skills,  setSkills]  = useState<Skill[]>([]);
  const [goals,   setGoals]   = useState<Goal[]>([]);
  const [projects,setProjects]= useState<Project[]>([]);
  const [stats,   setStats]   = useState<Stats|null>(null);
  const [opps,    setOpps]    = useState<Opp[]>([]);
  const [updates, setUpdates] = useState<{title?:string; kind:string}[]>([]);
  const [rec,     setRec]     = useState<{summary?:string; nextSkill?:{name?:string;why?:string}} | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [meRes, skillsRes, goalsRes, projRes, statsRes, oppsRes, recRes] = await Promise.all([
        authAPI.me(),
        skillsAPI.getMine(),
        goalsAPI.getMine({ status: 'active' }),
        projectsAPI.getMine(),
        analyticsAPI.myStats().catch(() => null),
        opportunitiesAPI.getAll({ limit: '4' }).catch(() => null),
        recommendationsAPI.getDashboardSummary().catch(() => null),
      ]);
      const u = meRes.data.user ?? meRes.data.data ?? meRes.data;
      setUser(u);
      setSkills(skillsRes.data.data ?? []);
      setGoals(goalsRes.data.data ?? []);
      setProjects(projRes.data.data ?? []);
      setStats(statsRes?.data?.data ?? null);
      setOpps(oppsRes?.data?.data ?? []);
      setRec(recRes?.data?.data ?? null);
      if (u?.verificationStatus === 'verified') {
        const updRes = await collegesAPI.studentUpdates().catch(() => null);
        const anns = (updRes?.data?.announcements ?? []).map((a: {title?:string}) => ({ ...a, kind: 'Announcement' }));
        const evts = (updRes?.data?.events ?? []).map((e: {title?:string}) => ({ ...e, kind: 'Event' }));
        setUpdates([...anns, ...evts].slice(0, 3));
      }
    } catch { setError('Could not load dashboard. Pull down to refresh.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const xp       = user?.xpPoints ?? 0;
  const level    = levelFromXP(xp);
  const progress = xpProgress(xp);
  const cs       = user?.codingStats ?? {};
  const name     = user?.name?.split(' ')[0] ?? 'Learner';

  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <ScrollView
        contentContainerStyle={S.scroll}
        refreshControl={<RefreshControl colors={[Colors.accent]} onRefresh={onRefresh} refreshing={refreshing} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}>

        {/* ── Top Bar ── */}
        <View style={S.topBar}>
          <View>
            <Text style={S.topEyebrow}>{greeting()}</Text>
            <Text style={S.topName}>{name} 👋</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')}>
            <Avatar initials={getInitials(user?.name)} size={46} />
          </Pressable>
        </View>

        {loading ? <DashboardSkeleton /> : (
          <>
            {error ? <ErrorBanner message={error} /> : null}

            {/* ── XP Card ── */}
            <XPCard xp={xp} level={level} progress={progress} streak={user?.streakDays ?? 0} />

            {/* ── Stats Row ── */}
            {stats && (
              <View style={S.statsRow}>
                <StatChip label="Skills" value={String(stats.totalSkills)} />
                <StatChip label="Goals" value={String(stats.activeGoals)} accent />
                <StatChip label="Projects" value={String(stats.totalProjects)} />
              </View>
            )}

            {/* ── Coding Snapshot ── */}
            {Object.keys(cs).length > 0 && (
              <Card style={S.sectionCard}>
                <SectionHeader title="Coding Stats" actionLabel="Update →" onAction={() => router.push('/(tabs)/profile')} />
                <View style={S.codingRow}>
                  {[
                    { label: 'Solved', value: cs.leetcodeSolved ?? 0,       color: Colors.accentLight },
                    { label: 'Easy',   value: cs.leetcodeEasy ?? 0,         color: Colors.success },
                    { label: 'Medium', value: cs.leetcodeMedium ?? 0,       color: Colors.warning },
                    { label: 'Hard',   value: cs.leetcodeHard ?? 0,         color: Colors.danger },
                  ].map(({ label, value, color }) => (
                    <View key={label} style={S.codingCell}>
                      <Text style={[S.codingVal, { color }]}>{value}</Text>
                      <Text style={S.codingLbl}>{label}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* ── AI Guidance ── */}
            {rec && <RecommendationCard rec={rec} />}

            {/* ── College Updates ── */}
            {updates.length > 0 && (
              <Card style={S.sectionCard}>
                <SectionHeader title="College Updates" />
                {updates.map((u, i) => (
                  <View key={i}>
                    {i > 0 && <Divider style={{ marginVertical: 10 }} />}
                    <Row style={{ gap: 10 }}>
                      <Badge label={u.kind} color={u.kind === 'Event' ? 'indigo' : 'teal'} />
                      <Text style={S.updateTitle} numberOfLines={1}>{u.title}</Text>
                    </Row>
                  </View>
                ))}
              </Card>
            )}

            {/* ── Opportunities Preview ── */}
            {opps.length > 0 && (
              <Card style={S.sectionCard}>
                <SectionHeader title="For You" actionLabel="See all" onAction={() => router.push('/(tabs)/opportunities')} />
                <View style={S.listGap}>
                  {opps.map((o) => <OppPreviewRow key={o._id} opp={o} />)}
                </View>
              </Card>
            )}

            {/* ── Skills ── */}
            <Card style={S.sectionCard}>
              <SectionHeader title="Top Skills" actionLabel="Profile →" onAction={() => router.push('/(tabs)/profile')} />
              {skills.length === 0
                ? <EmptyState emoji="🎯" title="No skills yet" body="Add skills from your profile to track your progress." />
                : <View style={S.skillsGrid}>{skills.slice(0, 6).map((sk, i) => <SkillChip key={i} skill={sk} />)}</View>}
            </Card>

            {/* ── Active Goals ── */}
            <Card style={S.sectionCard}>
              <SectionHeader title="Active Goals" actionLabel="All goals →" onAction={() => router.push('/(tabs)/profile')} />
              {goals.length === 0
                ? <EmptyState emoji="🏁" title="No active goals" body="Set deadlines and track progress toward your targets." />
                : <View style={S.listGap}>{goals.slice(0, 3).map((g, i) => <GoalRow key={i} goal={g} />)}</View>}
            </Card>

            {/* ── Projects ── */}
            {projects.length > 0 && (
              <Card style={S.sectionCard}>
                <SectionHeader title="Projects" actionLabel="View all" onAction={() => router.push('/(tabs)/profile')} />
                <View style={S.listGap}>{projects.slice(0, 3).map((p, i) => <ProjectRow key={i} project={p} />)}</View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function XPCard({ xp, level, progress, streak }: { xp:number; level:number; progress:number; streak:number }) {
  return (
    <View style={xpS.card}>
      <View style={xpS.glow1} /><View style={xpS.glow2} />
      <Row style={xpS.top}>
        <View>
          <Text style={xpS.levelLbl}>LEVEL {level}</Text>
          <Text style={xpS.xpNum}>{xp.toLocaleString()} XP</Text>
        </View>
        <View style={xpS.streak}>
          <Text style={xpS.streakFire}>🔥</Text>
          <Text style={xpS.streakNum}>{streak}</Text>
          <Text style={xpS.streakLbl}>day streak</Text>
        </View>
      </Row>
      <View style={{ gap: 8 }}>
        <Row style={xpS.progMeta}>
          <Text style={xpS.progLbl}>Progress to Level {level + 1}</Text>
          <Text style={xpS.progPct}>{progress}%</Text>
        </Row>
        <ProgressBar pct={progress} color={Colors.accent} height={8} />
      </View>
    </View>
  );
}
const xpS = StyleSheet.create({
  card: { backgroundColor: Colors.xpMid, borderColor: '#2E2A6A', borderRadius: Radius.xl, borderWidth: 1, gap: 20, overflow: 'hidden', padding: 20, ...Shadow.xp },
  glow1: { backgroundColor: '#4F46E5', borderRadius: 80, height: 120, left: -40, opacity: 0.14, position: 'absolute', top: -40, width: 120 },
  glow2: { backgroundColor: Colors.accent, borderRadius: 80, bottom: -50, height: 130, opacity: 0.08, position: 'absolute', right: -50, width: 130 },
  top: { justifyContent: 'space-between', alignItems: 'flex-start' },
  levelLbl: { ...Typography.label, color: Colors.xpLight, marginBottom: 4 },
  xpNum: { color: Colors.text0, fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  streak: { alignItems: 'center', backgroundColor: '#1A1440', borderColor: '#2E2A6A', borderRadius: Radius.full, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 8 },
  streakFire: { fontSize: 16 },
  streakNum: { color: Colors.text0, fontSize: 18, fontWeight: '800' },
  streakLbl: { ...Typography.bodySm, color: Colors.text3 },
  progMeta: { justifyContent: 'space-between' },
  progLbl: { ...Typography.bodySm, color: Colors.text3 },
  progPct: { ...Typography.mono, color: Colors.xpLight },
});

function SkillChip({ skill }: { skill: Skill }) {
  const c = skillColor(skill.category);
  const pct = skill.level ?? 0;
  return (
    <View style={skS.wrap}>
      <Row style={skS.top}>
        <View style={[skS.dot, { backgroundColor: c }]} />
        <Text style={skS.name} numberOfLines={1}>{skill.name}</Text>
        <Text style={[skS.pct, { color: c }]}>{pct}%</Text>
      </Row>
      <ProgressBar pct={pct} color={c} height={4} />
    </View>
  );
}
const skS = StyleSheet.create({
  wrap: { backgroundColor: Colors.bg3, borderColor: Colors.border1, borderRadius: Radius.md, borderWidth: 1, gap: 8, padding: 12, width: '48.5%' },
  top: { gap: 6 },
  dot: { borderRadius: 5, height: 8, width: 8 },
  name: { ...Typography.uiSm, color: Colors.text1, flex: 1 },
  pct: { ...Typography.mono, fontWeight: '700' },
});

function GoalRow({ goal }: { goal: Goal }) {
  const pColor = priorityColor(goal.priority);
  return (
    <View style={gS.wrap}>
      <Row style={gS.top}>
        <View style={[gS.dot, { backgroundColor: pColor }]} />
        <Text style={gS.title} numberOfLines={1}>{goal.title}</Text>
        <Text style={gS.date}>Due {fmtDate(goal.deadline)}</Text>
      </Row>
      <ProgressBar pct={goal.progress ?? 0} color={pColor} height={5} />
      <Row style={gS.meta}>
        <Text style={gS.pct}>{goal.progress ?? 0}% complete</Text>
        <Badge label={goal.priority ?? 'medium'} color={
          ({ high:'red', medium:'amber', low:'green' } as const)[goal.priority ?? ''] ?? 'muted'
        } />
      </Row>
    </View>
  );
}
const gS = StyleSheet.create({
  wrap: { backgroundColor: Colors.bg3, borderColor: Colors.border0, borderRadius: Radius.md, borderWidth: 1, gap: 10, padding: 14 },
  top: { gap: 8, justifyContent: 'space-between' },
  dot: { borderRadius: 5, height: 8, width: 8 },
  title: { ...Typography.h4, color: Colors.text0, flex: 1 },
  date: { ...Typography.bodySm, color: Colors.text3 },
  meta: { justifyContent: 'space-between' },
  pct: { ...Typography.bodySm, color: Colors.text3 },
});

function ProjectRow({ project }: { project: Project }) {
  return (
    <View style={pjS.wrap}>
      <Row style={pjS.top}>
        <Text style={pjS.title} numberOfLines={1}>{project.title}</Text>
        <Badge label={project.status ?? 'planned'} color={statusBadge(project.status)} />
      </Row>
      {(project.techStack?.length ?? 0) > 0 && (
        <Row style={pjS.tags}>
          {project.techStack!.slice(0, 4).map(t => (
            <View key={t} style={pjS.tag}><Text style={pjS.tagTxt}>{t}</Text></View>
          ))}
        </Row>
      )}
    </View>
  );
}
const pjS = StyleSheet.create({
  wrap: { backgroundColor: Colors.bg3, borderColor: Colors.border0, borderRadius: Radius.md, borderWidth: 1, gap: 10, padding: 14 },
  top: { gap: 10, justifyContent: 'space-between' },
  title: { ...Typography.h4, color: Colors.text0, flex: 1 },
  tags: { flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Colors.bg4, borderColor: Colors.border1, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  tagTxt: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },
});

function OppPreviewRow({ opp }: { opp: Opp }) {
  return (
    <View style={opS.wrap}>
      <Row style={opS.top}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={opS.title} numberOfLines={1}>{opp.title}</Text>
          <Text style={opS.company}>{opp.company}</Text>
        </View>
        <View style={{ gap: 6, alignItems: 'flex-end' }}>
          <Badge label={opp.type ?? 'opportunity'} color={oppBadge(opp.type)} />
          {opp.matchScore != null && (
            <Text style={opS.match}>{opp.matchScore}% match</Text>
          )}
        </View>
      </Row>
    </View>
  );
}
const opS = StyleSheet.create({
  wrap: { backgroundColor: Colors.bg3, borderColor: Colors.border0, borderRadius: Radius.md, borderWidth: 1, padding: 14 },
  top: { gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { ...Typography.h4, color: Colors.text0 },
  company: { ...Typography.bodySm, color: Colors.text3 },
  match: { ...Typography.mono, color: Colors.accentLight },
});

function RecommendationCard({ rec }: { rec: { summary?: string; nextSkill?: { name?: string; why?: string } } }) {
  return (
    <View style={rcS.card}>
      <Row style={rcS.header}>
        <View style={rcS.iconBox}><Text style={rcS.icon}>✦</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={rcS.title}>AI Guidance</Text>
          <Text style={rcS.sub}>Personalised for your profile</Text>
        </View>
      </Row>
      {rec.summary ? <Text style={rcS.body}>{rec.summary}</Text> : null}
      {rec.nextSkill && (
        <View style={rcS.nextBox}>
          <Text style={rcS.nextLbl}>Next to learn</Text>
          <Text style={rcS.nextName}>{rec.nextSkill.name}</Text>
          {rec.nextSkill.why ? <Text style={rcS.nextWhy}>{rec.nextSkill.why}</Text> : null}
        </View>
      )}
    </View>
  );
}
const rcS = StyleSheet.create({
  card: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid, borderRadius: Radius.xl, borderWidth: 1, gap: 14, padding: 18 },
  header: { gap: 12, alignItems: 'flex-start' },
  iconBox: { alignItems: 'center', backgroundColor: Colors.accentSoft, borderColor: Colors.accentMid, borderRadius: Radius.sm, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  icon: { color: Colors.accent, fontSize: 17, fontWeight: '900' },
  title: { ...Typography.h3, color: Colors.text0 },
  sub: { ...Typography.bodySm, color: Colors.text3 },
  body: { ...Typography.bodySm, color: Colors.text2, lineHeight: 21 },
  nextBox: { backgroundColor: Colors.accentSoft, borderColor: Colors.accentMid, borderRadius: Radius.md, borderWidth: 1, gap: 4, padding: 14 },
  nextLbl: { ...Typography.label, color: Colors.accent, fontSize: 10 },
  nextName: { ...Typography.h3, color: Colors.text0 },
  nextWhy: { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
});

function DashboardSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <View style={[xpS.card, { gap: 16 }]}>
        <Skeleton height={16} width="40%" />
        <Skeleton height={36} width="55%" />
        <Skeleton height={8} />
      </View>
      <View style={S.statsRow}>
        <Skeleton height={64} radius={12} style={{ flex: 1 }} />
        <Skeleton height={64} radius={12} style={{ flex: 1 }} />
        <Skeleton height={64} radius={12} style={{ flex: 1 }} />
      </View>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const S = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  scroll: { gap: 14, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 16 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  topEyebrow: { ...Typography.label, color: Colors.text3, fontSize: 10 },
  topName: { color: Colors.text0, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  sectionCard: { gap: 14 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  listGap: { gap: 10 },
  codingRow: { flexDirection: 'row', gap: 10 },
  codingCell: { alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1, borderRadius: Radius.md, borderWidth: 1, flex: 1, gap: 4, paddingVertical: 14 },
  codingVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  codingLbl: { ...Typography.bodySm, color: Colors.text3 },
  updateTitle: { ...Typography.h4, color: Colors.text1, flex: 1 },
});
