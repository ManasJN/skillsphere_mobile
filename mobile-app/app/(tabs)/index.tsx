/**
 * Home / Dashboard screen — Phase 4
 *
 * Key changes from Phase 3:
 *  - Section order: Goals first (student's primary work), then Skills,
 *    then Opportunities, then rest — hierarchy matches student intent
 *  - InsightBar: single contextual signal above XP card
 *  - SetupCard: onboarding checklist for new users with zero data
 *  - XPCard: shows "N XP to Level X" number + streak health color
 *  - Goals section: routes to /(tabs)/goals (not profile)
 *  - Active goals: tappable rows route to Goals tab
 *  - Empty states: each has one specific CTA
 *  - Stats row: replaced dead counts with meaningful rates from analyticsAPI
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Animated, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  analyticsAPI, authAPI, collegesAPI, goalsAPI,
  opportunitiesAPI, projectsAPI, recommendationsAPI, skillsAPI,
} from '@/lib/api';
import { Colors, NAV_BOTTOM_OFFSET, Radius, Spacing, Typography } from '@/lib/theme';
import {
  Avatar, Badge, Card, Divider, EmptyState, ErrorBanner,
  FadeView, GoalItem, ProgressBar, Row, SectionHeader,
  Skeleton, SkeletonCard, StatChip,
} from '@/components/ui';
import { InsightBar }  from '@/components/InsightBar';
import { SetupCard }   from '@/components/SetupCard';
import { getInitials, levelFromXP, xpProgress } from '@/hooks/useUser';
import {
  topInsight, streakHealth, xpToNextLevel,
  type Goal as PGoal,
} from '@/hooks/useProductivity';
import { usePressScale, useFadeSlideIn } from '@/hooks/useAnimations';

// ─── Local types ──────────────────────────────────────────────────────────────

type User = {
  name?: string; xpPoints?: number; streakDays?: number; cgpa?: number | string;
  codingStats?: Record<string, number>; verificationStatus?: string;
  collegeId?: { collegeName?: string }; college?: string;
  lastActiveAt?: string;
};
type Skill   = { name?: string; category?: string; level?: number };
type Goal    = { title?: string; priority?: string; progress?: number; deadline?: string; status?: string };
type Project = { title?: string; status?: string; techStack?: string[] };
type Stats   = {
  totalSkills: number; activeGoals: number; completedGoals: number;
  totalProjects: number; goalCompletionRate: number; avgSkillLevel: number;
};
type Opp     = { _id: string; title?: string; type?: string; company?: string; matchScore?: number; deadline?: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
function fmtDate(d?: string) {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(d));
}
function skillColor(cat?: string): string {
  return (Colors.skill as Record<string, string>)[cat ?? ''] ?? Colors.skill.default;
}
function statusBadge(s?: string): Parameters<typeof Badge>[0]['color'] {
  return ({ completed: 'green', ongoing: 'teal', planned: 'indigo', abandoned: 'red' } as const)[s ?? ''] ?? 'muted';
}
function oppBadge(t?: string): Parameters<typeof Badge>[0]['color'] {
  return ({ internship: 'teal', hackathon: 'indigo', job: 'green', research: 'blue', scholarship: 'amber' } as const)[t ?? ''] ?? 'muted';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [user,       setUser]      = useState<User | null>(null);
  const [skills,     setSkills]    = useState<Skill[]>([]);
  const [goals,      setGoals]     = useState<Goal[]>([]);
  const [projects,   setProjects]  = useState<Project[]>([]);
  const [stats,      setStats]     = useState<Stats | null>(null);
  const [opps,       setOpps]      = useState<Opp[]>([]);
  const [updates,    setUpdates]   = useState<{ title?: string; kind: string }[]>([]);
  const [rec,        setRec]       = useState<{ summary?: string; nextSkill?: { name?: string; why?: string } } | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [error,      setError]     = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [meRes, skillsRes, goalsRes, projRes, statsRes, oppsRes, recRes] = await Promise.all([
        authAPI.me(),
        skillsAPI.getMine(),
        goalsAPI.getMine({ status: 'active' }),
        projectsAPI.getMine(),
        analyticsAPI.myStats().catch(() => null),
        opportunitiesAPI.getAll({ limit: '3' }).catch(() => null),
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
        const anns = (updRes?.data?.announcements ?? []).map((a: { title?: string }) => ({ ...a, kind: 'Announcement' }));
        const evts = (updRes?.data?.events ?? []).map((e: { title?: string }) => ({ ...e, kind: 'Event' }));
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

  // Productivity signals
  const insight = topInsight({
    xp,
    streakDays: user?.streakDays ?? 0,
    lastActiveAt: user?.lastActiveAt,
    goals: goals as PGoal[],
    hasSkills: skills.length > 0,
  });

  const isNewUser = !loading && xp === 0 && skills.length === 0 && goals.length === 0;

  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <ScrollView
        contentContainerStyle={S.scroll}
        refreshControl={
          <RefreshControl
            colors={[Colors.accent]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}>

        {/* ── Top Bar ── */}
        <TopBarAnimated name={name} user={user} />

        {loading ? <DashboardSkeleton /> : (
          <FadeView delay={50}>
            {error ? <ErrorBanner message={error} /> : null}

            {/* ── Contextual insight bar ── */}
            {insight && <InsightBar insight={insight} />}

            {/* ── New user setup checklist ── */}
            {isNewUser && (
              <SetupCard
                hasSkills={skills.length > 0}
                hasGoals={goals.length > 0}
                hasCodingStats={Object.keys(cs).length > 0}
                isVerified={user?.verificationStatus === 'verified'}
              />
            )}

            {/* ── XP + Level card ── */}
            <XPCard
              xp={xp}
              level={level}
              progress={progress}
              streak={user?.streakDays ?? 0}
              lastActiveAt={user?.lastActiveAt}
            />

            {/* ── Momentum stats — meaningful rates, not dead counts ── */}
            {stats && (
              <View style={S.statsRow}>
                <StatChip
                  label="Completion"
                  value={`${stats.goalCompletionRate}%`}
                  sub="goal rate"
                  accent={stats.goalCompletionRate >= 70}
                />
                <StatChip
                  label="Avg skill"
                  value={`${stats.avgSkillLevel}%`}
                  sub={`${stats.totalSkills} tracked`}
                />
                <StatChip
                  label="Projects"
                  value={String(stats.totalProjects)}
                  sub={`${stats.completedGoals} goals done`}
                />
              </View>
            )}

            {/* ── Active goals — FIRST meaningful work section ── */}
            <SectionBlock>
              <SectionHeader
                title="Active Goals"
                actionLabel="All goals"
                onAction={() => router.push('/(tabs)/goals')}
              />
              {goals.length === 0 ? (
                <EmptyState
                  title="No active goals"
                  body="Start tracking what you want to achieve."
                />
              ) : (
                <View style={S.listGap}>
                  {goals.slice(0, 3).map((g, i) => (
                    <GoalItem
                      key={i}
                      title={g.title ?? ''}
                      progress={g.progress ?? 0}
                      priority={g.priority as any}
                      deadline={fmtDate(g.deadline)}
                      onPress={() => router.push('/(tabs)/goals')}
                    />
                  ))}
                  {goals.length > 3 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/goals')}
                      style={S.seeMoreBtn}>
                      <Text style={S.seeMoreTxt}>
                        +{goals.length - 3} more goal{goals.length - 3 > 1 ? 's' : ''}
                      </Text>
                      <Ionicons name="chevron-forward" size={13} color={Colors.accent} />
                    </Pressable>
                  )}
                </View>
              )}
            </SectionBlock>

            {/* ── Skills ── */}
            <SectionBlock style={S.openSection}>
              <SectionHeader
                title="Top Skills"
                actionLabel="Profile"
                onAction={() => router.push('/(tabs)/profile')}
              />
              {skills.length === 0 ? (
                <EmptyState
                  title="No skills tracked yet"
                  body="Add skills in your profile to see progress here."
                />
              ) : (
                <View style={S.skillsGrid}>
                  {skills.slice(0, 6).map((sk, i) => <SkillChip key={i} skill={sk} />)}
                </View>
              )}
            </SectionBlock>

            {/* ── Coding snapshot ── */}
            {Object.keys(cs).length > 0 && (
              <SectionBlock style={S.openSection}>
                <SectionHeader
                  title="Coding Stats"
                  actionLabel="Update"
                  onAction={() => router.push('/(tabs)/profile')}
                />
                <View style={S.codingRow}>
                  {[
                    { label: 'Solved', value: cs.leetcodeSolved ?? 0, color: Colors.accent },
                    { label: 'Easy',   value: cs.leetcodeEasy ?? 0,   color: Colors.success },
                    { label: 'Medium', value: cs.leetcodeMedium ?? 0, color: Colors.warning },
                    { label: 'Hard',   value: cs.leetcodeHard ?? 0,   color: Colors.danger },
                  ].map(({ label, value, color }) => (
                    <View key={label} style={S.codingCell}>
                      <Text style={[S.codingVal, { color }]}>{value}</Text>
                      <Text style={S.codingLbl}>{label}</Text>
                    </View>
                  ))}
                </View>
              </SectionBlock>
            )}

            {/* ── Opportunities ── */}
            {opps.length > 0 && (
              <SectionBlock style={S.openSection}>
                <SectionHeader
                  title="For You"
                  actionLabel="See all"
                  onAction={() => router.push('/(tabs)/opportunities')}
                />
                <View style={S.listGap}>
                  {opps.map((o) => <OppRow key={o._id} opp={o} />)}
                </View>
              </SectionBlock>
            )}

            {/* ── AI Guidance ── */}
            {rec && <GuidanceCard rec={rec} />}

            {/* ── College updates ── */}
            {updates.length > 0 && (
              <SectionBlock style={S.openSection}>
                <SectionHeader title="College Updates" />
                <View style={S.listGap}>
                  {updates.map((u, i) => (
                    <View key={i}>
                      {i > 0 && <Divider style={{ marginBottom: 10 }} />}
                      <Row style={{ gap: 8 }}>
                        <Badge label={u.kind} color={u.kind === 'Event' ? 'indigo' : 'teal'} />
                        <Text style={S.updateTitle} numberOfLines={1}>{u.title}</Text>
                      </Row>
                    </View>
                  ))}
                </View>
              </SectionBlock>
            )}

            {/* ── Projects ── */}
            {projects.length > 0 && (
              <SectionBlock style={S.openSection}>
                <SectionHeader
                  title="Projects"
                  actionLabel="View all"
                  onAction={() => router.push('/(tabs)/profile')}
                />
                <View style={S.listGap}>
                  {projects.slice(0, 3).map((p, i) => <ProjectRow key={i} project={p} />)}
                </View>
              </SectionBlock>
            )}
          </FadeView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TopBarAnimated — fade+slide entrance for the header ─────────────────────

function TopBarAnimated({ name, user }: { name: string; user: User | null }) {
  const { opacity, translateY } = useFadeSlideIn(0, 6);
  const { scale: nScale, onPressIn: nIn, onPressOut: nOut } = usePressScale(0.92);
  const { scale: aScale, onPressIn: aIn, onPressOut: aOut } = usePressScale(0.93);
  return (
    <Animated.View style={[S.topBar, { opacity, transform: [{ translateY }] }]}>
      <View>
        <Text style={S.topEyebrow}>{greeting()}</Text>
        <Text style={S.topName}>{name}</Text>
      </View>
      <View style={S.topActions}>
        <Pressable
          onPress={() => router.push('/(tabs)/notifications')}
          onPressIn={nIn}
          onPressOut={nOut}
          hitSlop={8}>
          <Animated.View style={[S.notifBtn, { transform: [{ scale: nScale }] }]}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text2} />
          </Animated.View>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          onPressIn={aIn}
          onPressOut={aOut}
          hitSlop={8}>
          <Animated.View style={{ transform: [{ scale: aScale }] }}>
            <Avatar initials={getInitials(user?.name)} size={38} />
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function SectionBlock({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[S.sectionBlock, style]}>{children}</View>;
}

function XPCard({ xp, level, progress, streak, lastActiveAt }: {
  xp: number; level: number; progress: number; streak: number; lastActiveAt?: string;
}) {
  const toNext = xpToNextLevel(xp);
  const health = streakHealth(streak, lastActiveAt);

  const streakColor =
    health === 'at_risk' ? Colors.warning :
    health === 'broken'  ? Colors.danger :
    health === 'new'     ? Colors.text3 :
    Colors.success;

  const streakLabel =
    health === 'at_risk' ? 'at risk' :
    health === 'broken'  ? 'broken' :
    streak === 0         ? 'no streak yet' :
    `${streak}d streak`;

  return (
    <View style={xpS.card}>
      <Row style={xpS.top}>
        <View>
          <Text style={xpS.levelLbl}>Level {level}</Text>
          <Text style={xpS.xpNum}>{xp.toLocaleString()} XP</Text>
        </View>
        {/* Streak pill — color reflects actual health */}
        <View style={[xpS.streakPill, { borderColor: streakColor + '55' }]}>
          <View style={[xpS.streakDot, { backgroundColor: streakColor }]} />
          <Text style={[xpS.streakTxt, { color: streakColor }]}>{streakLabel}</Text>
        </View>
      </Row>
      <View>
        <Row style={xpS.progMeta}>
          <Text style={xpS.progLbl}>To Level {level + 1}</Text>
          {/* Show the actual number remaining — more actionable than a percentage */}
          <Text style={xpS.progHint}>{toNext} XP needed</Text>
        </Row>
        <ProgressBar pct={progress} color={Colors.accent} height={5} style={{ marginTop: 7 }} />
      </View>
    </View>
  );
}

const xpS = StyleSheet.create({
  card: {
    borderBottomColor: Colors.border1,
    borderBottomWidth: 1,
    borderTopColor: Colors.border1,
    borderTopWidth: 1,
    gap: 18,
    paddingVertical: 18,
  },
  top:       { justifyContent: 'space-between', alignItems: 'flex-start' },
  levelLbl:  { ...Typography.label, color: Colors.text3, marginBottom: 3 },
  xpNum:     { ...Typography.h1, color: Colors.text0 },
  streakPill:{
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  streakDot: { borderRadius: Radius.full, height: 7, width: 7 },
  streakTxt: { ...Typography.bodyXs, fontWeight: '600' as const },
  progMeta:  { justifyContent: 'space-between' },
  progLbl:   { ...Typography.bodySm, color: Colors.text2 },
  progHint:  { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' as const },
});

// ─── Unchanged sub-components ─────────────────────────────────────────────────

function SkillChip({ skill }: { skill: Skill }) {
  const c = skillColor(skill.category);
  const pct = skill.level ?? 0;
  return (
    <View style={skS.wrap}>
      <Row style={{ gap: 6, marginBottom: 6 }}>
        <View style={[skS.dot, { backgroundColor: c }]} />
        <Text style={skS.name} numberOfLines={1}>{skill.name}</Text>
        <Text style={[skS.pct, { color: c }]}>{pct}%</Text>
      </Row>
      <ProgressBar pct={pct} color={c} height={3} />
    </View>
  );
}
const skS = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.sm, borderWidth: 1, padding: 10, width: '48.5%',
  },
  dot:  { borderRadius: 4, height: 7, width: 7 },
  name: { ...Typography.uiSm, color: Colors.text1, flex: 1 },
  pct:  { ...Typography.bodyXs, fontWeight: '600' as const },
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
  wrap: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.sm, borderWidth: 1, gap: 8, padding: 12,
  },
  top:    { gap: 10, justifyContent: 'space-between' },
  title:  { ...Typography.h4, color: Colors.text0, flex: 1 },
  tags:   { flexWrap: 'wrap', gap: 5 },
  tag:    {
    backgroundColor: Colors.bg4, borderColor: Colors.border1,
    borderRadius: Radius.xs, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2,
  },
  tagTxt: { ...Typography.bodyXs, color: Colors.text3, fontWeight: '500' as const },
});

function OppRow({ opp }: { opp: Opp }) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.98);
  return (
    <Pressable
      onPress={() => router.push('/(tabs)/opportunities')}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <Animated.View style={[opS.wrap, { transform: [{ scale }] }]}>
        <Row style={opS.top}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={opS.title} numberOfLines={1}>{opp.title}</Text>
            <Text style={opS.company}>{opp.company}</Text>
          </View>
          <View style={{ gap: 5, alignItems: 'flex-end' }}>
            <Badge label={opp.type ?? 'opportunity'} color={oppBadge(opp.type)} />
            {opp.matchScore != null && (
              <Text style={opS.match}>{opp.matchScore}% match</Text>
            )}
          </View>
        </Row>
      </Animated.View>
    </Pressable>
  );
}
const opS = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.sm, borderWidth: 1, padding: 12,
  },
  top:     { gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' },
  title:   { ...Typography.h4, color: Colors.text0 },
  company: { ...Typography.bodySm, color: Colors.text3 },
  match:   { ...Typography.bodyXs, color: Colors.accent, fontWeight: '500' as const },
});

function GuidanceCard({ rec }: { rec: { summary?: string; nextSkill?: { name?: string; why?: string } } }) {
  return (
    <Card>
      <Row style={{ gap: 10, marginBottom: 10 }}>
        <View style={gcS.iconBox}>
          <Text style={gcS.iconTxt}>AI</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={gcS.title}>Guidance</Text>
          <Text style={gcS.sub}>Personalised for your profile</Text>
        </View>
      </Row>
      {rec.summary ? <Text style={gcS.body}>{rec.summary}</Text> : null}
      {rec.nextSkill && (
        <View style={gcS.nextBox}>
          <Text style={gcS.nextLbl}>Next to learn</Text>
          <Text style={gcS.nextName}>{rec.nextSkill.name}</Text>
          {rec.nextSkill.why ? <Text style={gcS.nextWhy}>{rec.nextSkill.why}</Text> : null}
        </View>
      )}
    </Card>
  );
}
const gcS = StyleSheet.create({
  iconBox: {
    alignItems: 'center', backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid, borderRadius: Radius.xs, borderWidth: 1,
    height: 32, justifyContent: 'center', width: 32,
  },
  iconTxt:  { ...Typography.label, color: Colors.accent, fontSize: 10 },
  title:    { ...Typography.h4, color: Colors.text0 },
  sub:      { ...Typography.bodyXs, color: Colors.text3 },
  body:     { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  nextBox:  {
    backgroundColor: Colors.accentDim, borderColor: Colors.accentMid,
    borderRadius: Radius.sm, borderWidth: 1, gap: 3, padding: 12, marginTop: 10,
  },
  nextLbl:  { ...Typography.label, color: Colors.accent, fontSize: 9 },
  nextName: { ...Typography.h4, color: Colors.text0 },
  nextWhy:  { ...Typography.bodySm, color: Colors.text2, lineHeight: 19 },
});

function DashboardSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      <Skeleton height={36} radius={Radius.sm} />
      <View style={[xpS.card, { gap: 14 }]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ gap: 8 }}>
            <Skeleton height={11} width={60} />
            <Skeleton height={28} width={120} />
          </View>
          <Skeleton height={32} width={100} radius={Radius.sm} />
        </Row>
        <View style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Skeleton height={10} width={80} />
            <Skeleton height={10} width={80} />
          </Row>
          <Skeleton height={5} radius={Radius.full} />
        </View>
      </View>
      <View style={S.statsRow}>
        {[0,1,2].map(i => <Skeleton key={i} height={60} radius={Radius.md} style={{ flex: 1 }} />)}
      </View>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

// ─── Screen styles ────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:   { backgroundColor: Colors.bg1, flex: 1 },
  scroll: {
    gap: 16,
    paddingBottom: NAV_BOTTOM_OFFSET + 20,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  topBar: {
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'space-between', marginBottom: 4,
  },
  topEyebrow: { ...Typography.bodyXs, color: Colors.text3 },
  topName:    { ...Typography.h1, color: Colors.text0, marginTop: 1 },
  topActions: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  notifBtn: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.sm, borderWidth: 1, height: 38, justifyContent: 'center', width: 38,
  },
  statsRow:   { flexDirection: 'row', gap: 8, marginTop: -4 },
  sectionBlock: { gap: 10 },
  openSection: {
    borderTopColor: Colors.border0,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listGap:    { gap: 8 },
  codingRow:  { flexDirection: 'row', gap: 8, marginTop: 8 },
  codingCell: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.sm, borderWidth: 1, flex: 1, gap: 3, paddingVertical: 12,
  },
  codingVal:   { ...Typography.statSm },
  codingLbl:   { ...Typography.bodyXs, color: Colors.text3 },
  updateTitle: { ...Typography.bodySm, color: Colors.text1, flex: 1 },
  seeMoreBtn: {
    alignItems: 'center', flexDirection: 'row', gap: 4,
    justifyContent: 'center', paddingVertical: 8,
  },
  seeMoreTxt: { ...Typography.bodySm, color: Colors.accent },
});
