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

const skillColors: Record<string, string> = {
  'AI/ML': '#8B5CF6',
  Cloud: '#10B981',
  DSA: '#4F46E5',
  Default: '#94A3B8',
  'UI/UX': '#EC4899',
  'Web Development': '#06B6D4',
};

type User = {
  batch?: string;
  cgpa?: number | string;
  codingStats?: Record<string, number>;
  college?: string;
  collegeId?: { collegeName?: string };
  department?: string;
  name?: string;
  rollNumber?: string;
  semester?: number | string;
  socialLinks?: Record<string, string>;
  streakDays?: number;
  verificationStatus?: string;
  xpPoints?: number;
};

type Skill = {
  category?: string;
  level?: number;
  name?: string;
};

type Goal = {
  deadline?: string;
  priority?: string;
  progress?: number;
  title?: string;
};

type Project = {
  status?: string;
  techStack?: string[];
  title?: string;
};

type RecommendationSummary = {
  hasRecommendations?: boolean;
  nextSkill?: { name?: string; why?: string };
  profileComplete?: boolean;
  roadmapPhase?: { timeframe?: string; title?: string };
  summary?: string;
};

type CollegeUpdates = {
  announcements: { _id?: string; body?: string; title?: string }[];
  events: { _id?: string; description?: string; title?: string }[];
};

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

  const loadDashboard = useCallback(async () => {
    setError('');

    try {
      analyticsAPI.myStats().catch(() => {});

      const [meRes, skillsRes, goalsRes, projectsRes, recommendationRes] = await Promise.all([
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
      setRecommendation(recommendationRes?.data?.data ?? null);

      if (nextUser?.verificationStatus === 'verified') {
        const updatesRes = await collegesAPI.studentUpdates().catch(() => null);
        setUpdates({
          announcements: updatesRes?.data?.announcements ?? [],
          events: updatesRes?.data?.events ?? [],
        });
      }
    } catch {
      setError('Could not load dashboard. Pull to refresh or sign in again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const xp = user?.xpPoints ?? 0;
  const level = levelFromXP(xp);
  const progress = xpProgress(xp);
  const codingStats = user?.codingStats ?? {};
  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] ?? 'Learner';

  const collegeItems = useMemo(
    () => [
      ...updates.announcements.map((item) => ({ ...item, body: item.body, kind: 'Announcement' })),
      ...updates.events.map((item) => ({ ...item, body: item.description, kind: 'Event' })),
    ].slice(0, 4),
    [updates],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#5EEAD4"
            colors={['#5EEAD4']}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Dashboard</Text>
            <Text style={styles.title}>
              {greeting}, {firstName}
            </Text>
            <Text style={styles.subtitle}>
              {user?.department ?? 'Department'} · Semester {user?.semester ?? '-'} ·{' '}
              {user?.rollNumber ?? 'Roll number'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#5EEAD4" />
            <Text style={styles.mutedText}>Loading your dashboard</Text>
          </View>
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <VerificationCard user={user} updateItems={collegeItems} />

            <View style={styles.card}>
              <View style={styles.levelRow}>
                <Text style={styles.cardLabel}>Level {level}</Text>
                <Text style={styles.monoText}>{progress}% to Level {level + 1}</Text>
              </View>
              <ProgressBar color="#4F46E5" pct={progress} />
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="CGPA" value={String(user?.cgpa ?? '-')} />
              <StatCard label="LeetCode solved" value={String(codingStats.leetcodeSolved ?? 0)} />
              <StatCard label="CF rating" value={String(codingStats.codeforcesRating ?? '-')} />
              <StatCard label="GitHub contributions" value={String(codingStats.githubContributions ?? 0)} />
            </View>

            <RecommendationCard summary={recommendation} />

            <DashboardSection
              actionLabel="Manage"
              onAction={() => router.push('/(tabs)/profile')}
              title="Top skills">
              {skills.length === 0 ? (
                <EmptyText text="No skills yet. Add skills you are working on this semester." />
              ) : (
                skills.slice(0, 5).map((skill, index) => (
                  <View key={`${skill.name}-${index}`} style={styles.progressItem}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{skill.name ?? 'Skill'}</Text>
                      <Text style={styles.monoText}>{skill.level ?? 0}%</Text>
                    </View>
                    <ProgressBar
                      color={skillColors[skill.category ?? 'Default'] ?? skillColors.Default}
                      pct={skill.level ?? 0}
                    />
                  </View>
                ))
              )}
            </DashboardSection>

            <DashboardSection
              actionLabel="All goals"
              onAction={() => router.push('/(tabs)/profile')}
              title="Active goals">
              {goals.length === 0 ? (
                <EmptyText text="No active goals. Set a goal with a deadline to track progress here." />
              ) : (
                goals.slice(0, 3).map((goal, index) => (
                  <View key={`${goal.title}-${index}`} style={styles.listItem}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{goal.title ?? 'Goal'}</Text>
                      <Badge label={goal.priority ?? 'medium'} variant={priorityColor(goal.priority)} />
                    </View>
                    <View style={styles.itemHeader}>
                      <Text style={styles.metaText}>{goal.progress ?? 0}% complete</Text>
                      <Text style={styles.metaText}>{formatDate(goal.deadline)}</Text>
                    </View>
                    <ProgressBar
                      color={goal.priority === 'high' ? '#4F46E5' : '#64748B'}
                      pct={goal.progress ?? 0}
                    />
                  </View>
                ))
              )}
            </DashboardSection>

            <DashboardSection
              actionLabel="View all"
              onAction={() => router.push('/(tabs)/profile')}
              title="Projects">
              {projects.length === 0 ? (
                <EmptyText text="No projects yet." />
              ) : (
                projects.slice(0, 3).map((project, index) => (
                  <View key={`${project.title}-${index}`} style={styles.listItem}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{project.title ?? 'Project'}</Text>
                      <Badge label={project.status ?? 'planned'} variant={statusColor(project.status)} />
                    </View>
                    <View style={styles.tagRow}>
                      {project.techStack?.slice(0, 3).map((tech) => (
                        <Text key={tech} style={styles.tag}>
                          {tech}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </DashboardSection>

            <DashboardSection
              actionLabel="Update"
              onAction={() => router.push('/(tabs)/profile')}
              title="Coding profile">
              <View style={styles.codingGrid}>
                {[
                  { label: 'Easy', value: codingStats.leetcodeEasy ?? 0 },
                  { label: 'Medium', value: codingStats.leetcodeMedium ?? 0 },
                  { label: 'Hard', value: codingStats.leetcodeHard ?? 0 },
                  { label: 'Contests', value: codingStats.contestsParticipated ?? 0 },
                ].map((item) => (
                  <View key={item.label} style={styles.codingCell}>
                    <Text style={styles.codingValue}>{item.value}</Text>
                    <Text style={styles.metaText}>{item.label}</Text>
                  </View>
                ))}
              </View>
              {Object.entries(user?.socialLinks ?? {}).map(([site, link]) =>
                link ? (
                  <Text key={site} numberOfLines={1} style={styles.linkText}>
                    {site}: {link.replace(/^https?:\/\//, '')}
                  </Text>
                ) : null,
              )}
            </DashboardSection>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VerificationCard({
  updateItems,
  user,
}: {
  updateItems: { _id?: string; body?: string; kind: string; title?: string }[];
  user: User | null;
}) {
  const status = user?.verificationStatus ?? 'unsubmitted';
  const isVerified = status === 'verified';

  return (
    <View style={styles.card}>
      <Badge label={isVerified ? 'Verified' : status === 'unsubmitted' ? 'Pending Verification' : status} variant={isVerified ? 'green' : 'amber'} />
      <Text style={styles.cardTitle}>
        {isVerified ? user?.collegeId?.collegeName ?? user?.college ?? 'College verified' : 'Complete college verification'}
      </Text>
      <Text style={styles.cardText}>
        {isVerified
          ? 'You have access to official college announcements, resources, opportunities, and internal updates.'
          : 'Submit your college ID from your profile to unlock official college updates.'}
      </Text>

      {isVerified && updateItems.length > 0 ? (
        <View style={styles.updateList}>
          {updateItems.map((item) => (
            <View key={`${item.kind}-${item._id ?? item.title}`} style={styles.updateItem}>
              <Badge label={item.kind} variant={item.kind === 'Event' ? 'purple' : 'cyan'} />
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text numberOfLines={2} style={styles.metaText}>
                {item.body}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function RecommendationCard({ summary }: { summary: RecommendationSummary | null }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Career guidance</Text>
          <Text style={styles.metaText}>Personalized paths based on your profile and activity</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Open</Text>
        </Pressable>
      </View>

      {summary?.hasRecommendations ? (
        <>
          <Text style={styles.cardText}>{summary.summary}</Text>
          {summary.nextSkill ? (
            <View style={styles.listItem}>
              <Text style={styles.metaText}>Next focus</Text>
              <Text style={styles.itemTitle}>{summary.nextSkill.name}</Text>
              <Text style={styles.metaText}>{summary.nextSkill.why}</Text>
            </View>
          ) : null}
          {summary.roadmapPhase ? (
            <Text style={styles.metaText}>
              Roadmap: {summary.roadmapPhase.title} ({summary.roadmapPhase.timeframe})
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.cardText}>
          {summary?.profileComplete
            ? 'Generate recommendations from your career inputs.'
            : 'Tell us your interests and weak areas to get a tailored plan.'}
        </Text>
      )}
    </View>
  );
}

function DashboardSection({
  actionLabel,
  children,
  onAction,
  title,
}: {
  actionLabel: string;
  children: React.ReactNode;
  onAction: () => void;
  title: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable onPress={onAction} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>{actionLabel}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

function ProgressBar({ color, pct }: { color: string; pct: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { backgroundColor: color, width: `${clamp(pct)}%` }]} />
    </View>
  );
}

function Badge({ label, variant }: { label: string; variant: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: badgeColor(variant) }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function levelFromXP(xp: number) {
  return Math.floor(xp / 500) + 1;
}

function xpProgress(xp: number) {
  const level = levelFromXP(xp);
  const base = (level - 1) * 500;
  return Math.round(((xp - base) / 500) * 100);
}

function getInitials(name = '') {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'SS';
}

function formatDate(date?: string) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(date),
  );
}

function priorityColor(priority?: string) {
  return { high: 'red', low: 'green', medium: 'amber' }[priority ?? ''] ?? 'cyan';
}

function statusColor(status?: string) {
  return { abandoned: 'red', completed: 'green', ongoing: 'cyan', planned: 'purple' }[status ?? ''] ?? 'cyan';
}

function badgeColor(variant: string) {
  return (
    {
      amber: '#78350F',
      cyan: '#164E63',
      green: '#14532D',
      purple: '#4C1D95',
      red: '#7F1D1D',
    }[variant] ?? '#1E293B'
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#080B12',
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 34,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#1E293B',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 18,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#134E4A',
    borderRadius: 8,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  avatarText: {
    color: '#5EEAD4',
    fontSize: 17,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    color: '#5EEAD4',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 24,
  },
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  cardLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '900',
  },
  cardText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
  },
  levelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
    width: '48.5%',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionTitleWrap: {
    flex: 1,
    gap: 3,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  ghostButton: {
    borderColor: '#263449',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostButtonText: {
    color: '#5EEAD4',
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: '#1E293B',
    borderRadius: 999,
    height: 7,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  progressItem: {
    gap: 7,
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: '#F8FAFC',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  listItem: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    gap: 9,
    padding: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#081225',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  codingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  codingCell: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: 12,
    width: '48.5%',
  },
  codingValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  updateList: {
    gap: 10,
  },
  updateItem: {
    borderTopColor: '#1E293B',
    borderTopWidth: 1,
    gap: 7,
    paddingTop: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  monoText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  mutedText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    backgroundColor: '#451A1A',
    borderColor: '#7F1D1D',
    borderRadius: 8,
    borderWidth: 1,
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    padding: 12,
  },
  linkText: {
    color: '#93C5FD',
    fontSize: 12,
  },
});
