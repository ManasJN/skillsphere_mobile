import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import {
  analyticsAPI,
  authAPI,
  collegesAPI,
  goalsAPI,
  projectsAPI,
  recommendationsAPI,
  skillsAPI,
} from '@/lib/api';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/lib/theme';
import { Avatar, Badge, Card, EmptyState, ProgressBar, Row, SectionHeader, StatChip } from '@/components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────
type User = {
  batch?: string; cgpa?: number | string; codingStats?: Record<string, number>;
  college?: string; collegeId?: { collegeName?: string }; department?: string;
  name?: string; rollNumber?: string; semester?: number | string;
  socialLinks?: Record<string, string>; streakDays?: number;
  verificationStatus?: string; xpPoints?: number;
};
type Skill  = { category?: string; level?: number; name?: string };
type Goal   = { deadline?: string; priority?: string; progress?: number; title?: string };
type Project = { status?: string; techStack?: string[]; title?: string };
type RecommendationSummary = {
  hasRecommendations?: boolean; nextSkill?: { name?: string; why?: string };
  profileComplete?: boolean; roadmapPhase?: { timeframe?: string; title?: string }; summary?: string;
};
type CollegeUpdates = {
  announcements: { _id?: string; body?: string; title?: string }[];
  events: { _id?: string; description?: string; title?: string }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function getInitials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'SS';
}
function levelFromXP(xp: number) { return Math.floor(xp / 500) + 1; }
function xpProgress(xp: number) {
  const lv = levelFromXP(xp);
  return Math.round(((xp - (lv - 1) * 500) / 500) * 100);
}
function formatDate(d?: string) {
  if (!d) return '–';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(d));
}
function priorityBadge(p?: string): Parameters<typeof Badge>[0]['color'] {
  return ({ high: 'red', medium: 'amber', low: 'green' } as const)[p ?? ''] ?? 'muted';
}
function statusBadge(s?: string): Parameters<typeof Badge>[0]['color'] {
  return ({ completed: 'green', ongoing: 'teal', planned: 'indigo', abandoned: 'red' } as const)[s ?? ''] ?? 'muted';
}
function skillColor(cat?: string) {
  return (
    {
      'Web Development': Colors.skill.webDev,
      'AI/ML': Colors.skill.aiml,
      Cloud: Colors.skill.cloud,
      DSA: Colors.skill.dsa,
      'UI/UX': Colors.skill.uiux,
    }[cat ?? ''] ?? Colors.skill.default
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationSummary | null>(null);
  const [updates, setUpdates] = useState<CollegeUpdates>({ announcements: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      analyticsAPI.myStats().catch(() => {});
      const [meRes, skillsRes, goalsRes, projectsRes, recRes] = await Promise.all([
        authAPI.me(),
        skillsAPI.getMine(),
        goalsAPI.getMine({ status: 'active' }),
        projectsAPI.getMine(),
        recommendationsAPI.getDashboardSummary().catch(() => null),
      ]);
      const nextUser = meRes.data.user ?? meRes.data.data ?? meRes.data;
      setUser(nextUser);
      setSkills(skillsRes.data.data ?? []);
      setGoals(goalsRes.data.data ?? []);
      setProjects(projectsRes.data.data ?? []);
      setRecommendation(recRes?.data?.data ?? null);
      if (nextUser?.verificationStatus === 'verified') {
        const updRes = await collegesAPI.studentUpdates().catch(() => null);
        setUpdates({ announcements: updRes?.data?.announcements ?? [], events: updRes?.data?.events ?? [] });
      }
    } catch { setError('Could not load dashboard. Pull down to refresh.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const xp = user?.xpPoints ?? 0;
  const level = levelFromXP(xp);
  const progress = xpProgress(xp);
  const cs = user?.codingStats ?? {};
  const firstName = user?.name?.split(' ')[0] ?? 'Learner';

  const collegeItems = useMemo(() => [
    ...updates.announcements.map(a => ({ ...a, kind: 'Announcement' as const })),
    ...updates.events.map(e => ({ ...e, body: e.description, kind: 'Event' as const })),
  ].slice(0, 3), [updates]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
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
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarEyebrow}>{getGreeting()}</Text>
            <Text style={styles.topBarName}>{firstName} 👋</Text>
          </View>
          <Avatar initials={getInitials(user?.name)} size={46} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.loadingText}>Loading your dashboard…</Text>
          </View>
        ) : (
          <>
            {error ? <ErrorBanner message={error} /> : null}

            {/* ── XP Hero Card ── */}
            <XPCard xp={xp} level={level} progress={progress} streak={user?.streakDays ?? 0} />

            {/* ── Quick Stats ── */}
            <View style={styles.statsRow}>
              <StatChip label="CGPA" value={String(user?.cgpa ?? '–')} />
              <StatChip label="LeetCode" value={String(cs.leetcodeSolved ?? 0)} accent />
              <StatChip label="CF Rating" value={String(cs.codeforcesRating ?? '–')} />
            </View>

            {/* ── College / Verification ── */}
            <VerificationSection user={user} items={collegeItems} />

            {/* ── AI Recommendation ── */}
            {recommendation !== null && <RecommendationCard summary={recommendation} />}

            {/* ── Skills ── */}
            <Section title="Top Skills" actionLabel="Manage" onAction={() => router.push('/(tabs)/profile')}>
              {skills.length === 0 ? (
                <EmptyState title="No skills tracked yet" body="Add skills from your profile to see progress here." />
              ) : (
                <View style={styles.skillsGrid}>
                  {skills.slice(0, 6).map((skill, i) => (
                    <SkillChip key={`${skill.name}-${i}`} skill={skill} />
                  ))}
                </View>
              )}
            </Section>

            {/* ── Active Goals ── */}
            <Section title="Active Goals" actionLabel="See all" onAction={() => router.push('/(tabs)/profile')}>
              {goals.length === 0 ? (
                <EmptyState title="No active goals" body="Set goals with deadlines to track them here." />
              ) : (
                <View style={styles.listGap}>
                  {goals.slice(0, 3).map((goal, i) => (
                    <GoalRow key={`${goal.title}-${i}`} goal={goal} />
                  ))}
                </View>
              )}
            </Section>

            {/* ── Projects ── */}
            <Section title="Projects" actionLabel="View all" onAction={() => router.push('/(tabs)/profile')}>
              {projects.length === 0 ? (
                <EmptyState title="No projects yet" body="Add a project to showcase your work." />
              ) : (
                <View style={styles.listGap}>
                  {projects.slice(0, 3).map((project, i) => (
                    <ProjectRow key={`${project.title}-${i}`} project={project} />
                  ))}
                </View>
              )}
            </Section>

            {/* ── Coding Stats ── */}
            <Section title="Coding Profile" actionLabel="Update" onAction={() => router.push('/(tabs)/profile')}>
              <View style={styles.codingGrid}>
                {[
                  { label: 'Easy',      value: cs.leetcodeEasy ?? 0,           color: Colors.low },
                  { label: 'Medium',    value: cs.leetcodeMedium ?? 0,         color: Colors.medium },
                  { label: 'Hard',      value: cs.leetcodeHard ?? 0,           color: Colors.high },
                  { label: 'Contests',  value: cs.contestsParticipated ?? 0,   color: Colors.xp },
                ].map(item => (
                  <View key={item.label} style={styles.codingCell}>
                    <Text style={[styles.codingValue, { color: item.color }]}>{item.value}</Text>
                    <Text style={styles.codingLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </Section>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function XPCard({ xp, level, progress, streak }: { xp: number; level: number; progress: number; streak: number }) {
  return (
    <View style={xpStyles.card}>
      {/* Subtle glow spots */}
      <View style={xpStyles.glowTL} />
      <View style={xpStyles.glowBR} />

      <View style={xpStyles.top}>
        <View>
          <Text style={xpStyles.levelLabel}>LEVEL {level}</Text>
          <Text style={xpStyles.xpValue}>{xp.toLocaleString()} XP</Text>
        </View>
        <View style={xpStyles.streakPill}>
          <Text style={xpStyles.streakFire}>🔥</Text>
          <Text style={xpStyles.streakNum}>{streak}</Text>
          <Text style={xpStyles.streakSuffix}>day streak</Text>
        </View>
      </View>

      <View style={xpStyles.progressWrap}>
        <View style={xpStyles.progressMeta}>
          <Text style={xpStyles.progressLabel}>Progress to Level {level + 1}</Text>
          <Text style={xpStyles.progressPct}>{progress}%</Text>
        </View>
        <ProgressBar pct={progress} color={Colors.accent} height={8} />
      </View>
    </View>
  );
}

const xpStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.xpSoft, borderColor: '#2E2A6A', borderRadius: Radius.xl,
    borderWidth: 1, gap: 20, overflow: 'hidden', padding: 20, ...Shadow.md,
  },
  glowTL: {
    backgroundColor: '#4F46E5', borderRadius: 80, height: 100, left: -30,
    opacity: 0.12, position: 'absolute', top: -30, width: 100,
  },
  glowBR: {
    backgroundColor: Colors.accent, borderRadius: 80, bottom: -40,
    height: 120, opacity: 0.08, position: 'absolute', right: -40, width: 120,
  },
  top: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  levelLabel: { ...Typography.label, color: Colors.xp, marginBottom: 4 },
  xpValue: { color: Colors.text0, fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  streakPill: {
    alignItems: 'center', backgroundColor: '#1A1440', borderColor: '#2E2A6A',
    borderRadius: Radius.full, borderWidth: 1, flexDirection: 'row', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  streakFire: { fontSize: 16 },
  streakNum: { color: Colors.text0, fontSize: 18, fontWeight: '800' },
  streakSuffix: { ...Typography.bodySm, color: Colors.text3 },
  progressWrap: { gap: 8 },
  progressMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...Typography.bodySm, color: Colors.text3 },
  progressPct: { ...Typography.mono, color: Colors.xp },
});

function Section({
  title, actionLabel, onAction, children,
}: { title: string; actionLabel: string; onAction: () => void; children: React.ReactNode }) {
  return (
    <Card style={styles.sectionCard}>
      <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />
      {children}
    </Card>
  );
}

function SkillChip({ skill }: { skill: Skill }) {
  const color = skillColor(skill.category);
  const pct = skill.level ?? 0;
  return (
    <View style={skillChipStyles.wrap}>
      <View style={skillChipStyles.top}>
        <View style={[skillChipStyles.dot, { backgroundColor: color }]} />
        <Text style={skillChipStyles.name} numberOfLines={1}>{skill.name}</Text>
        <Text style={[skillChipStyles.pct, { color }]}>{pct}%</Text>
      </View>
      <ProgressBar pct={pct} color={color} height={4} />
    </View>
  );
}
const skillChipStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1, borderRadius: Radius.md,
    borderWidth: 1, gap: 8, padding: 12, width: '48.5%',
  },
  top: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  dot: { borderRadius: 4, height: 8, width: 8 },
  name: { ...Typography.uiSm, color: Colors.text1, flex: 1 },
  pct: { ...Typography.mono, fontWeight: '700' },
});

function GoalRow({ goal }: { goal: Goal }) {
  return (
    <View style={rowStyles.wrap}>
      <Row style={rowStyles.header}>
        <Text style={rowStyles.title} numberOfLines={1}>{goal.title ?? 'Goal'}</Text>
        <Badge label={goal.priority ?? 'medium'} color={priorityBadge(goal.priority)} />
      </Row>
      <ProgressBar pct={goal.progress ?? 0} color={goal.priority === 'high' ? Colors.xp : Colors.accent} height={5} />
      <Row style={rowStyles.meta}>
        <Text style={rowStyles.metaText}>{goal.progress ?? 0}% done</Text>
        <Text style={rowStyles.metaText}>Due {formatDate(goal.deadline)}</Text>
      </Row>
    </View>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <View style={rowStyles.wrap}>
      <Row style={rowStyles.header}>
        <Text style={rowStyles.title} numberOfLines={1}>{project.title ?? 'Project'}</Text>
        <Badge label={project.status ?? 'planned'} color={statusBadge(project.status)} />
      </Row>
      {(project.techStack?.length ?? 0) > 0 && (
        <Row style={rowStyles.tags}>
          {project.techStack!.slice(0, 4).map(t => (
            <View key={t} style={rowStyles.tag}><Text style={rowStyles.tagText}>{t}</Text></View>
          ))}
        </Row>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bg3, borderColor: Colors.border0, borderRadius: Radius.md,
    borderWidth: 1, gap: 10, padding: 14,
  },
  header: { gap: 10, justifyContent: 'space-between' },
  title: { ...Typography.h3, color: Colors.text0, flex: 1 },
  meta: { justifyContent: 'space-between' },
  metaText: { ...Typography.bodySm, color: Colors.text3 },
  tags: { flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: Colors.bg4, borderColor: Colors.border1, borderRadius: Radius.full,
    borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3,
  },
  tagText: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },
});

function VerificationSection({
  user, items,
}: { user: User | null; items: { _id?: string; body?: string; kind: string; title?: string }[] }) {
  const isVerified = user?.verificationStatus === 'verified';
  return (
    <View style={verStyles.card}>
      <Row style={verStyles.header}>
        <Badge
          label={isVerified ? 'Verified' : 'Unverified'}
          color={isVerified ? 'teal' : 'amber'}
        />
        <Text style={verStyles.college} numberOfLines={1}>
          {isVerified
            ? (user?.collegeId?.collegeName ?? user?.college ?? 'College verified')
            : 'Complete verification'}
        </Text>
      </Row>
      <Text style={verStyles.body}>
        {isVerified
          ? 'You have access to official college announcements and events.'
          : 'Submit your college ID to unlock official updates and opportunities.'}
      </Text>
      {isVerified && items.length > 0 && (
        <View style={verStyles.updates}>
          {items.map((item, i) => (
            <View key={`${item.kind}-${i}`} style={verStyles.updateRow}>
              <Badge label={item.kind} color={item.kind === 'Event' ? 'indigo' : 'teal'} />
              <Text style={verStyles.updateTitle} numberOfLines={1}>{item.title}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const verStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2, borderColor: Colors.border1, borderRadius: Radius.lg,
    borderWidth: 1, gap: 12, padding: 16,
  },
  header: { gap: 10 },
  college: { ...Typography.uiSm, color: Colors.text1, flex: 1 },
  body: { ...Typography.bodySm, color: Colors.text3, lineHeight: 20 },
  updates: { gap: 10 },
  updateRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  updateTitle: { ...Typography.uiSm, color: Colors.text1, flex: 1 },
});

function RecommendationCard({ summary }: { summary: RecommendationSummary }) {
  return (
    <View style={recStyles.card}>
      <Row style={recStyles.header}>
        <View style={recStyles.iconWrap}>
          <Text style={recStyles.icon}>✦</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={recStyles.title}>Career Guidance</Text>
          <Text style={recStyles.sub}>Personalized to your profile</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')} hitSlop={10}>
          <Text style={recStyles.openLink}>Open →</Text>
        </Pressable>
      </Row>
      {summary.hasRecommendations ? (
        <>
          {summary.summary ? <Text style={recStyles.body}>{summary.summary}</Text> : null}
          {summary.nextSkill ? (
            <View style={recStyles.nextSkill}>
              <Text style={recStyles.nextLabel}>Next focus</Text>
              <Text style={recStyles.nextName}>{summary.nextSkill.name}</Text>
              {summary.nextSkill.why ? <Text style={recStyles.nextWhy}>{summary.nextSkill.why}</Text> : null}
            </View>
          ) : null}
        </>
      ) : (
        <Text style={recStyles.body}>
          {summary.profileComplete
            ? 'Generate recommendations from your career inputs.'
            : 'Complete your profile to get a personalised growth plan.'}
        </Text>
      )}
    </View>
  );
}
const recStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.accentDim, borderColor: '#1A4A40', borderRadius: Radius.lg,
    borderWidth: 1, gap: 14, padding: 16,
  },
  header: { alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    alignItems: 'center', backgroundColor: Colors.accentSoft, borderColor: '#1A4A40',
    borderRadius: Radius.sm, borderWidth: 1, height: 36, justifyContent: 'center', width: 36,
  },
  icon: { color: Colors.accent, fontSize: 18, fontWeight: '800' },
  title: { ...Typography.h3, color: Colors.text0 },
  sub: { ...Typography.bodySm, color: Colors.text3 },
  openLink: { ...Typography.uiSm, color: Colors.accentText },
  body: { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  nextSkill: {
    backgroundColor: Colors.accentSoft, borderColor: '#1A4A40', borderRadius: Radius.md,
    borderWidth: 1, gap: 4, padding: 12,
  },
  nextLabel: { ...Typography.label, color: Colors.accent, fontSize: 10 },
  nextName: { ...Typography.h3, color: Colors.text0 },
  nextWhy: { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
});

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorDot}>●</Text>
      <Text style={styles.errorMsg}>{message}</Text>
    </View>
  );
}

// ─── Root Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 14, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 16 },

  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  topBarLeft: { gap: 2 },
  topBarEyebrow: { ...Typography.label, color: Colors.text3, fontSize: 10 },
  topBarName: { color: Colors.text0, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },

  loadingWrap: { alignItems: 'center', gap: 14, paddingVertical: 60 },
  loadingText: { ...Typography.body, color: Colors.text3 },

  statsRow: { flexDirection: 'row', gap: 10 },

  sectionCard: { gap: 14 },

  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  listGap: { gap: 10 },

  codingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  codingCell: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1, gap: 4, padding: 14, width: '48%',
  },
  codingValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  codingLabel: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },

  errorBanner: {
    alignItems: 'flex-start', backgroundColor: '#1C0000', borderColor: '#4C0519',
    borderRadius: Radius.sm, borderWidth: 1, flexDirection: 'row', gap: 8, padding: Spacing.md,
  },
  errorDot: { color: Colors.danger, fontSize: 10, marginTop: 3 },
  errorMsg: { ...Typography.bodySm, color: Colors.danger, flex: 1 },
});
