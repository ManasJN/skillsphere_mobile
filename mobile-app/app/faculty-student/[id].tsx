import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, ProgressBar, Row } from '@/components/ui';
import { getInitials, levelFromXP } from '@/hooks/useUser';
import { facultyAPI, type FacultyStudent } from '@/lib/faculty';
import { Colors, Layout, Radius, Spacing, Surface, Typography } from '@/lib/theme';

const EMPTY = '-';

export default function FacultyStudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [student, setStudent] = useState<FacultyStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!id) {
      setError('Student information is unavailable.');
      setLoading(false);
      return;
    }
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await facultyAPI.getStudent(id);
      setStudent(res.data?.data ?? res.data ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not load student profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (!student || error) return <ErrorState message={error} onRetry={load} />;

  const xp = student.xpPoints ?? 0;
  const level = student.level ?? levelFromXP(xp);
  const coding = student.codingStats ?? {};
  const skills = Array.isArray(student.skills) ? student.skills : [];
  const projects = Array.isArray(student.projects) ? student.projects : [];
  const achievements = Array.isArray(student.achievements) ? student.achievements : [];
  const goals = Array.isArray(student.goals) ? student.goals : [];
  const activeGoals = goals.filter(goal => goal?.status === 'active');
  const completedGoals = goals.filter(goal => goal?.status === 'completed');
  const github = student.platformProfiles?.github || (student as any).githubUsername;

  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <TopBar />
      <ScrollView
        contentContainerStyle={S.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}>
        <View style={S.hero}>
          <ProfileAvatar avatar={student.avatar} name={student.name} />
          <View style={S.heroCopy}>
            <Text style={S.name}>{student.name?.trim() || 'Student'}</Text>
            <Text style={S.roll}>{student.rollNumber || 'Roll number unavailable'}</Text>
            <Row style={S.badges}>
              <Badge label={student.department || 'Department unavailable'} color="teal" />
              <Badge label={`Semester ${student.semester ?? EMPTY}`} color="muted" />
            </Row>
          </View>
        </View>

        <Section title="Performance" icon="stats-chart-outline">
          <View style={S.statGrid}>
            <Stat label="XP" value={xp.toLocaleString()} accent />
            <Stat label="Level" value={String(level)} />
            <Stat label="Leaderboard rank" value={student.leaderboardRank ? `#${student.leaderboardRank}` : EMPTY} />
          </View>
        </Section>

        <Section title="Coding" icon="code-slash-outline">
          <View style={S.statGrid}>
            <Stat label="LeetCode solved" value={metric(coding.leetcodeSolved)} accent />
            <Stat label="Easy" value={metric(coding.leetcodeEasy)} color={Colors.success} />
            <Stat label="Medium" value={metric(coding.leetcodeMedium)} color={Colors.warning} />
            <Stat label="Hard" value={metric(coding.leetcodeHard)} color={Colors.danger} />
          </View>
          <InfoRow icon="logo-github" label="GitHub" value={github ? `@${github}` : 'Not connected'} />
        </Section>

        <Section title="Portfolio" icon="briefcase-outline">
          <Subheading label="Skills" count={skills.length} />
          {skills.length ? skills.map((skill, index) => (
            <View key={skill._id ?? `${skill.name}-${index}`} style={S.skillRow}>
              <View style={[S.skillDot, { backgroundColor: skillColor(skill.category) }]} />
              <View style={S.flexGap}>
                <Row style={S.spread}>
                  <Text style={S.itemTitle}>{skill.name || 'Unnamed skill'}</Text>
                  <Text style={[S.percent, { color: skillColor(skill.category) }]}>{skill.level ?? 0}%</Text>
                </Row>
                <ProgressBar pct={skill.level ?? 0} color={skillColor(skill.category)} height={4} />
              </View>
            </View>
          )) : <EmptyLine text="No skills added yet." />}

          <Subheading label="Projects" count={projects.length} />
          {projects.length ? projects.map((project, index) => (
            <View key={project._id ?? `${project.title}-${index}`} style={S.project}>
              <Row style={S.spread}>
                <Text style={S.itemTitle} numberOfLines={1}>{project.title || 'Untitled project'}</Text>
                <Badge label={project.status || 'planned'} color={project.status === 'completed' ? 'green' : 'muted'} />
              </Row>
              {project.description ? <Text style={S.description} numberOfLines={2}>{project.description}</Text> : null}
              {!!project.techStack?.length && <Text style={S.meta} numberOfLines={1}>{project.techStack.join(' / ')}</Text>}
            </View>
          )) : <EmptyLine text="No projects added yet." />}

          <Subheading label="Achievements" count={achievements.length} />
          {achievements.length ? achievements.map((earned, index) => (
            <View key={earned._id ?? index} style={S.achievement}>
              <Text style={S.achievementIcon}>{earned.achievement?.icon || '*'}</Text>
              <View style={S.flexGap}>
                <Text style={S.itemTitle}>{earned.achievement?.title || 'Achievement'}</Text>
                <Text style={S.meta}>
                  {earned.achievement?.xpReward ? `+${earned.achievement.xpReward} XP` : earned.achievement?.rarity || 'Earned'}
                </Text>
              </View>
            </View>
          )) : <EmptyLine text="No achievements earned yet." />}
        </Section>

        <Section title="Goals" icon="flag-outline">
          <View style={S.statGrid}>
            <Stat label="Active goals" value={String(activeGoals.length)} accent />
            <Stat label="Completed goals" value={String(completedGoals.length)} color={Colors.success} />
          </View>
          {activeGoals.length ? activeGoals.slice(0, 4).map((goal, index) => (
            <View key={goal._id ?? index} style={S.goal}>
              <Row style={S.spread}>
                <Text style={S.itemTitle} numberOfLines={1}>{goal.title || 'Untitled goal'}</Text>
                <Text style={S.percent}>{goal.progress ?? 0}%</Text>
              </Row>
              <ProgressBar pct={goal.progress ?? 0} height={4} />
            </View>
          )) : <EmptyLine text="No active goals." />}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function TopBar() {
  return (
    <View style={S.topBar}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={S.back}>
        <Ionicons name="chevron-back" size={20} color={Colors.text1} />
      </Pressable>
      <Text style={S.topTitle}>Student overview</Text>
      <View style={S.back} />
    </View>
  );
}

function LoadingState() {
  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <TopBar />
      <View style={S.center}>
        <ActivityIndicator color={Colors.accent} />
        <Text style={S.muted}>Loading student profile...</Text>
      </View>
    </SafeAreaView>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <TopBar />
      <View style={S.center}>
        <Ionicons name="alert-circle-outline" size={28} color={Colors.danger} />
        <Text style={S.error}>{message || 'Student profile was not found.'}</Text>
        <Pressable onPress={onRetry} style={S.retry}><Text style={S.retryText}>Try again</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

function ProfileAvatar({ avatar, name }: { avatar?: string; name?: string }) {
  if (avatar) return <Image source={{ uri: avatar }} style={S.avatar} contentFit="cover" transition={150} />;
  return <View style={S.avatarFallback}><Text style={S.avatarText}>{getInitials(name)}</Text></View>;
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={S.section}>
      <Row style={S.sectionHead}>
        <View style={S.sectionIcon}><Ionicons name={icon as any} size={15} color={Colors.accent} /></View>
        <Text style={S.sectionTitle}>{title}</Text>
      </Row>
      {children}
    </View>
  );
}

function Stat({ label, value, accent, color }: { label: string; value: string; accent?: boolean; color?: string }) {
  return (
    <View style={[S.stat, accent && S.statAccent]}>
      <Text style={[S.statValue, accent && S.statValueAccent, color ? { color } : null]}>{value}</Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Row style={S.infoRow}>
      <Ionicons name={icon as any} size={16} color={Colors.text2} />
      <Text style={S.infoLabel}>{label}</Text>
      <Text style={S.infoValue} numberOfLines={1}>{value}</Text>
    </Row>
  );
}

function Subheading({ label, count }: { label: string; count: number }) {
  return <Row style={S.subheading}><Text style={S.subheadingText}>{label}</Text><Text style={S.count}>{count}</Text></Row>;
}

function EmptyLine({ text }: { text: string }) {
  return <Text style={S.emptyLine}>{text}</Text>;
}

function metric(value?: number) {
  return value === undefined || value === null ? EMPTY : value.toLocaleString();
}

function skillColor(category?: string) {
  return (Colors.skill as Record<string, string>)[category ?? ''] ?? Colors.skill.default;
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg1 },
  topBar: { alignItems: 'center', borderBottomColor: Colors.border0, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.md },
  back: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  topTitle: { ...Typography.h4, color: Colors.text0 },
  content: { gap: Spacing.md, padding: Layout.screenPadding, paddingBottom: Spacing.xxxl },
  center: { alignItems: 'center', flex: 1, gap: Spacing.md, justifyContent: 'center', padding: Spacing.xxl },
  muted: { ...Typography.bodySm, color: Colors.text3 },
  error: { ...Typography.bodySm, color: Colors.danger, textAlign: 'center' },
  retry: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid, borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9 },
  retryText: { ...Typography.uiSm, color: Colors.accent },
  hero: { ...Surface.selected, alignItems: 'center', flexDirection: 'row', gap: Spacing.lg, padding: Spacing.lg },
  avatar: { backgroundColor: Colors.bg3, borderRadius: Radius.full, height: 76, width: 76 },
  avatarFallback: { alignItems: 'center', backgroundColor: Colors.accentSoft, borderColor: Colors.accentMid, borderRadius: Radius.full, borderWidth: 1, height: 76, justifyContent: 'center', width: 76 },
  avatarText: { ...Typography.h2, color: Colors.accentLight },
  heroCopy: { flex: 1, gap: 4 },
  name: { ...Typography.h2, color: Colors.text0 },
  roll: { ...Typography.bodySm, color: Colors.text3 },
  badges: { flexWrap: 'wrap', gap: 6, marginTop: 6 },
  section: { ...Surface.card, gap: Spacing.md, padding: Spacing.lg },
  sectionHead: { gap: Spacing.sm },
  sectionIcon: { alignItems: 'center', backgroundColor: Colors.accentDim, borderRadius: Radius.sm, height: 30, justifyContent: 'center', width: 30 },
  sectionTitle: { ...Typography.h3, color: Colors.text0 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stat: { backgroundColor: Colors.bg3, borderColor: Colors.border1, borderRadius: Radius.md, borderWidth: 1, flexGrow: 1, minWidth: '30%', padding: Spacing.md },
  statAccent: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  statValue: { ...Typography.statSm, color: Colors.text0 },
  statValueAccent: { color: Colors.accentLight },
  statLabel: { ...Typography.bodyXs, color: Colors.text3, marginTop: 2 },
  infoRow: { backgroundColor: Colors.bg3, borderRadius: Radius.md, gap: Spacing.sm, padding: Spacing.md },
  infoLabel: { ...Typography.uiSm, color: Colors.text2 },
  infoValue: { ...Typography.bodySm, color: Colors.text0, flex: 1, textAlign: 'right' },
  subheading: { borderTopColor: Colors.border0, borderTopWidth: 1, justifyContent: 'space-between', paddingTop: Spacing.md },
  subheadingText: { ...Typography.h4, color: Colors.text1 },
  count: { ...Typography.bodyXs, color: Colors.text3 },
  skillRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
  skillDot: { borderRadius: Radius.full, height: 8, width: 8 },
  flexGap: { flex: 1, gap: 6 },
  spread: { gap: Spacing.sm, justifyContent: 'space-between' },
  itemTitle: { ...Typography.uiSm, color: Colors.text0, flex: 1 },
  percent: { ...Typography.bodyXs, color: Colors.text2, fontWeight: '700' },
  project: { backgroundColor: Colors.bg3, borderColor: Colors.border0, borderRadius: Radius.md, borderWidth: 1, gap: 6, padding: Spacing.md },
  description: { ...Typography.bodySm, color: Colors.text2, lineHeight: 19 },
  meta: { ...Typography.bodyXs, color: Colors.text3 },
  achievement: { alignItems: 'center', backgroundColor: Colors.bg3, borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  achievementIcon: { fontSize: 20 },
  goal: { gap: Spacing.sm },
  emptyLine: { ...Typography.bodySm, color: Colors.text4, paddingVertical: Spacing.sm, textAlign: 'center' },
});
