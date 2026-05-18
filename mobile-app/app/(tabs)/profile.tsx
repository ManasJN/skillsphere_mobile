import { StyleSheet, Text, View } from 'react-native';

import { Card, Metric, SectionTitle, SkillScreen, palette } from './_components/skill-screen';

export default function ProfileScreen() {
  return (
    <SkillScreen
      eyebrow="Profile"
      subtitle="A quick snapshot of your track, achievements, and campus learning status."
      title="Aarav Mehta">
      <Card>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AM</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>Mobile App Track</Text>
            <Text style={styles.meta}>Semester 4 · Computer Science</Text>
          </View>
        </View>
      </Card>

      <View style={styles.metricRow}>
        <Card>
          <Metric label="Badges" value="18" />
        </Card>
        <Card>
          <Metric label="Rank" value="#2" />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle>Skill Progress</SectionTitle>
        {[
          ['React Native', '88%'],
          ['Problem Solving', '76%'],
          ['System Design', '64%'],
        ].map(([skill, progress]) => (
          <View key={skill} style={styles.skillRow}>
            <Text style={styles.skillName}>{skill}</Text>
            <Text style={styles.skillProgress}>{progress}</Text>
          </View>
        ))}
      </View>
    </SkillScreen>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: '#042F2E',
    fontSize: 20,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900',
  },
  meta: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    gap: 12,
  },
  skillRow: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  skillName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
  },
  skillProgress: {
    color: palette.accent,
    fontSize: 15,
    fontWeight: '900',
  },
});
