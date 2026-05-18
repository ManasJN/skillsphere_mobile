import { StyleSheet, Text, View } from 'react-native';

import { Card, SectionTitle, SkillScreen, palette } from './_components/skill-screen';

const updates = [
  { body: 'Your mentor reviewed the API practice task.', time: '8 min ago', title: 'Feedback received' },
  { body: 'React Native quiz opens at 6:00 PM.', time: '1 hr ago', title: 'Quiz reminder' },
  { body: 'Mobile cohort moved into the top 10 this week.', time: 'Today', title: 'Cohort progress' },
];

export default function NotificationsScreen() {
  return (
    <SkillScreen
      eyebrow="Notifications"
      subtitle="Stay current on deadlines, mentor feedback, and cohort activity."
      title="Updates">
      <Card>
        <Text style={styles.summaryTitle}>3 priority items</Text>
        <Text style={styles.summaryText}>Review feedback first, then finish your evening quiz prep.</Text>
      </Card>

      <View style={styles.section}>
        <SectionTitle>Recent</SectionTitle>
        {updates.map((update) => (
          <View key={update.title} style={styles.notification}>
            <View style={styles.dot} />
            <View style={styles.notificationCopy}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{update.title}</Text>
                <Text style={styles.notificationTime}>{update.time}</Text>
              </View>
              <Text style={styles.notificationBody}>{update.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </SkillScreen>
  );
}

const styles = StyleSheet.create({
  summaryTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
  },
  summaryText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  section: {
    gap: 12,
  },
  notification: {
    alignItems: 'flex-start',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  dot: {
    backgroundColor: palette.accent,
    borderRadius: 6,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  notificationCopy: {
    flex: 1,
    gap: 6,
  },
  notificationHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  notificationTitle: {
    color: palette.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  notificationTime: {
    color: palette.mutedDark,
    fontSize: 12,
    fontWeight: '800',
  },
  notificationBody: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
