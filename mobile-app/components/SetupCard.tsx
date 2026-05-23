/**
 * SetupCard — onboarding checklist for new users with zero data.
 *
 * Shows when: xp === 0 AND skills.length === 0 AND goals.length === 0.
 * Disappears automatically once any step is completed (next refresh).
 *
 * Design: a single card, four tappable rows, each routing to the right screen.
 * No progress ring, no celebration, no badge. Just "here's what to do first."
 * Feels like a Notion welcome checklist, not a game tutorial.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Colors, Radius, Typography } from '@/lib/theme';
import { Divider, Row } from '@/components/ui';

type Step = {
  key: string;
  label: string;
  sub: string;
  route: string;
  done: boolean;
};

type Props = {
  hasSkills: boolean;
  hasGoals: boolean;
  hasCodingStats: boolean;
  isVerified: boolean;
};

export function SetupCard({ hasSkills, hasGoals, hasCodingStats, isVerified }: Props) {
  const steps: Step[] = [
    {
      key:   'skills',
      label: 'Add your first skill',
      sub:   'Track what you know and what you\'re learning',
      route: '/(tabs)/profile',
      done:  hasSkills,
    },
    {
      key:   'goals',
      label: 'Create your first goal',
      sub:   'Set a target with a deadline and track progress',
      route: '/(tabs)/goals',
      done:  hasGoals,
    },
    {
      key:   'coding',
      label: 'Add your coding stats',
      sub:   'LeetCode, GitHub, Codeforces — sync your profile',
      route: '/(tabs)/profile',
      done:  hasCodingStats,
    },
    {
      key:   'verify',
      label: 'Verify your college',
      sub:   'Unlock announcements, events, and opportunities',
      route: '/(tabs)/profile',
      done:  isVerified,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;

  // All done — card should not render. Parent checks this first but
  // double-check here for safety.
  if (doneCount === steps.length) return null;

  return (
    <View style={S.card}>
      <Row style={S.header}>
        <View>
          <Text style={S.title}>Get started</Text>
          <Text style={S.sub}>{doneCount} of {steps.length} done</Text>
        </View>
        {/* Minimal progress indicator — four dots, no ring */}
        <Row style={S.dots}>
          {steps.map(st => (
            <View
              key={st.key}
              style={[S.dot, st.done ? S.dotDone : S.dotPending]}
            />
          ))}
        </Row>
      </Row>

      <Divider style={{ marginBottom: 4 }} />

      {steps.map((step, i) => (
        <View key={step.key}>
          {i > 0 && <Divider />}
          <Pressable
            onPress={() => !step.done && router.push(step.route as any)}
            style={({ pressed }) => [
              S.stepRow,
              step.done && S.stepRowDone,
              pressed && !step.done && S.stepRowPressed,
            ]}>
            {/* Check or empty box */}
            <View style={[S.check, step.done && S.checkDone]}>
              {step.done && (
                <Ionicons name="checkmark" size={12} color={Colors.bg1} />
              )}
            </View>
            <View style={S.stepText}>
              <Text style={[S.stepLabel, step.done && S.stepLabelDone]}>
                {step.label}
              </Text>
              {!step.done && (
                <Text style={S.stepSub}>{step.sub}</Text>
              )}
            </View>
            {!step.done && (
              <Ionicons name="chevron-forward" size={15} color={Colors.text3} />
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderLeftColor: Colors.accent,
    borderLeftWidth: 3,
    borderTopRightRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    overflow: 'hidden',
  },

  header:  { justifyContent: 'space-between', padding: 14, paddingLeft: 14 },
  title:   { ...Typography.h4, color: Colors.text0, marginBottom: 2 },
  sub:     { ...Typography.bodyXs, color: Colors.text3 },

  dots:    { gap: 5 },
  dot:     { borderRadius: Radius.full, height: 7, width: 7 },
  dotDone:    { backgroundColor: Colors.accent },
  dotPending: { backgroundColor: Colors.border2 },

  stepRow:       { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  stepRowDone:   { opacity: 0.5 },
  stepRowPressed:{ backgroundColor: Colors.bg3 },

  check: {
    alignItems: 'center',
    backgroundColor: Colors.bg4,
    borderColor: Colors.border2,
    borderRadius: 4,
    borderWidth: 1.5,
    flexShrink: 0,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkDone: { backgroundColor: Colors.accent, borderColor: Colors.accent },

  stepText:     { flex: 1, gap: 2 },
  stepLabel:    { ...Typography.uiSm, color: Colors.text0, fontWeight: '500' as const },
  stepLabelDone:{ color: Colors.text3 },
  stepSub:      { ...Typography.bodyXs, color: Colors.text3, lineHeight: 16 },
});
