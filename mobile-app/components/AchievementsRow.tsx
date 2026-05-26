/**
 * AchievementsRow — horizontal scroll of earned achievements.
 *
 * Lives on the profile screen only, below the hero card.
 * Minimal footprint: icon + title chips, no modals, no animations.
 * Shown only when at least one achievement has been earned.
 *
 * Rarity colors are muted — common=muted, rare=blue, epic=indigo, legendary=amber.
 * No glowing effects, no pulsing, no size differences.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { Skeleton } from '@/components/ui';

type Achievement = {
  _id: string;
  earnedAt: string;
  achievement: {
    title: string;
    description: string;
    icon: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xpReward: number;
  } | null;
};

type Props = {
  achievements: Achievement[];
  loading?: boolean;
};

const RARITY_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  common:    { bg: Colors.bg4,      border: Colors.border2,  text: Colors.text2 },
  rare:      { bg: '#0C1826',       border: '#1A3048',       text: Colors.accentLight },
  epic:      { bg: '#13152A',       border: '#252854',       text: '#9B9FDC' },
  legendary: { bg: '#1E1600',       border: '#3D2E00',       text: Colors.warning },
};

export function AchievementsRow({ achievements, loading }: Props) {
  if (loading) {
    return (
      <View style={S.wrap}>
        <Text style={S.title}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.row}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} width={110} height={56} radius={Radius.md} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (achievements.length === 0) return null;

  return (
    <View style={S.wrap}>
      <View style={S.head}>
        <Text style={S.title}>Achievements</Text>
        <Text style={S.count}>{achievements.length} earned</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.row}>
        {achievements.map(ea => {
          const a = ea.achievement;
          if (!a) return null;
          const rar = RARITY_STYLE[a.rarity] ?? RARITY_STYLE.common;
          return (
            <View
              key={ea._id}
              style={[S.chip, { borderColor: rar.border }]}>
              {/* Icon as text — server stores emoji strings. Kept small. */}
              <Text style={S.chipIcon}>{a.icon}</Text>
              <View style={S.chipText}>
                <Text style={[S.chipTitle, { color: rar.text }]} numberOfLines={1}>
                  {a.title}
                </Text>
                <Text style={S.chipXP}>+{a.xpReward} XP</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  wrap: {
    borderTopColor: Colors.border0,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 16,
  },
  head: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  title: { ...Typography.h3, color: Colors.text0 },
  count: { ...Typography.bodyXs, color: Colors.text3 },
  row:  { gap: 8, paddingBottom: 2, paddingRight: Spacing.lg },
  chip: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: 142,
  },
  chipIcon:  { fontSize: 16 },
  chipText:  { flex: 1, gap: 2 },
  chipTitle: { ...Typography.bodyXs, fontWeight: '600' as const },
  chipXP:    { ...Typography.bodyXs, color: Colors.text3 },
});
