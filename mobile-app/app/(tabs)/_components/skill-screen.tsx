import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const palette = {
  accent: '#5EEAD4',
  accentSoft: '#134E4A',
  background: '#080B12',
  border: '#1E293B',
  card: '#0F172A',
  muted: '#94A3B8',
  mutedDark: '#64748B',
  surface: '#111827',
  text: '#F8FAFC',
  warning: '#FBBF24',
};

type SkillScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function SkillScreen({ children, eyebrow, subtitle, title }: SkillScreenProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: palette.background,
  },
  content: {
    gap: 18,
    paddingBottom: 34,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '800',
  },
  metric: {
    flex: 1,
    gap: 4,
  },
  metricValue: {
    color: palette.text,
    fontSize: 25,
    fontWeight: '900',
  },
  metricLabel: {
    color: palette.mutedDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
