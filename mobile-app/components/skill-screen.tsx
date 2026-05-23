/**
 * skill-screen.tsx — legacy wrapper, retained for compatibility.
 * Use @/components/ui for all new components.
 */
export { Colors as palette } from '@/lib/theme';
export { Card } from '@/components/ui';

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib/theme';

type SkillScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function SkillScreen({ children, eyebrow, subtitle, title, refreshControl }: SkillScreenProps) {
  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <ScrollView
        contentContainerStyle={S.content}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}>
        <View style={S.header}>
          <Text style={S.eyebrow}>{eyebrow}</Text>
          <Text style={S.title}>{title}</Text>
          <Text style={S.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={S.sectionTitle}>{children}</Text>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={S.metric}>
      <Text style={S.metricValue}>{value}</Text>
      <Text style={S.metricLabel}>{label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  safe:    { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 16, paddingBottom: 34, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  header:  { gap: 6 },
  eyebrow: { ...Typography.label, color: Colors.accent },
  title:   { ...Typography.h1, color: Colors.text0 },
  subtitle:{ ...Typography.body, color: Colors.text2 },
  sectionTitle: { ...Typography.h3, color: Colors.text0 },
  metric:  { flex: 1, gap: 3 },
  metricValue: { ...Typography.statSm, color: Colors.text0 },
  metricLabel: { ...Typography.bodyXs, color: Colors.text3, fontWeight: '600' as const },
});
