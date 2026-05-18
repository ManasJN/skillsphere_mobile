import { StyleSheet, Text, View } from 'react-native';

import { Card, SectionTitle, SkillScreen, palette } from './_components/skill-screen';

const learners = [
  { name: 'Mira Shah', points: '12,480 XP', rank: 1, track: 'Full Stack' },
  { name: 'Aarav Mehta', points: '11,940 XP', rank: 2, track: 'Mobile' },
  { name: 'Ishan Rao', points: '10,720 XP', rank: 3, track: 'Data Science' },
  { name: 'Naina Kapoor', points: '9,880 XP', rank: 4, track: 'Cloud' },
];

export default function LeaderboardScreen() {
  return (
    <SkillScreen
      eyebrow="Leaderboard"
      subtitle="Compare weekly progress with classmates across every learning track."
      title="Top Learners">
      <Card>
        <View style={styles.podium}>
          <Text style={styles.podiumRank}>#2</Text>
          <View style={styles.podiumCopy}>
            <Text style={styles.podiumName}>You are 540 XP from first place</Text>
            <Text style={styles.podiumMeta}>Two focused sessions can close the gap today.</Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionTitle>Weekly Ranking</SectionTitle>
        {learners.map((learner) => (
          <View key={learner.rank} style={styles.row}>
            <View style={[styles.rankBadge, learner.rank === 2 && styles.currentBadge]}>
              <Text style={styles.rankText}>{learner.rank}</Text>
            </View>
            <View style={styles.learnerInfo}>
              <Text style={styles.learnerName}>{learner.name}</Text>
              <Text style={styles.learnerTrack}>{learner.track}</Text>
            </View>
            <Text style={styles.points}>{learner.points}</Text>
          </View>
        ))}
      </View>
    </SkillScreen>
  );
}

const styles = StyleSheet.create({
  podium: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  podiumRank: {
    color: palette.warning,
    fontSize: 40,
    fontWeight: '900',
  },
  podiumCopy: {
    flex: 1,
    gap: 4,
  },
  podiumName: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '900',
  },
  podiumMeta: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  row: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  currentBadge: {
    backgroundColor: palette.accentSoft,
  },
  rankText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '900',
  },
  learnerInfo: {
    flex: 1,
    gap: 3,
  },
  learnerName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
  },
  learnerTrack: {
    color: palette.mutedDark,
    fontSize: 13,
    fontWeight: '700',
  },
  points: {
    color: palette.accent,
    fontSize: 14,
    fontWeight: '900',
  },
});
