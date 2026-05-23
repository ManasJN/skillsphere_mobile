/**
 * InsightBar — one contextual signal at the top of the dashboard.
 *
 * Shows the single most important thing the student should know right now.
 * Tappable if the insight has a route. Dismissable.
 *
 * Rules:
 *  - One line only — not a card, not a modal
 *  - No icon decorations — text and color carry the meaning
 *  - Left border color signals urgency (same system as reminder cards)
 *  - Disappears on dismiss for the session (not persisted — will reappear next open)
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Colors, Radius, Typography } from '@/lib/theme';
import type { Insight } from '@/hooks/useProductivity';

const BORDER_COLORS: Record<Insight['color'], string> = {
  accent:  Colors.accent,
  warning: Colors.warning,
  danger:  Colors.danger,
  success: Colors.success,
  muted:   Colors.border2,
};

const TEXT_COLORS: Record<Insight['color'], string> = {
  accent:  Colors.accentLight,
  warning: Colors.warning,
  danger:  Colors.danger,
  success: Colors.success,
  muted:   Colors.text3,
};

type Props = { insight: Insight };

export function InsightBar({ insight }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const borderColor = BORDER_COLORS[insight.color];
  const textColor   = TEXT_COLORS[insight.color];
  const tappable    = !!insight.route;

  const handlePress = () => {
    if (insight.route) router.push(insight.route as any);
  };

  return (
    <Pressable
      onPress={tappable ? handlePress : undefined}
      style={({ pressed }) => [
        S.bar,
        { borderLeftColor: borderColor },
        pressed && tappable && S.barPressed,
      ]}>
      <Text style={[S.message, { color: textColor }]} numberOfLines={2}>
        {insight.message}
      </Text>
      <View style={S.right}>
        {tappable && (
          <Ionicons name="chevron-forward" size={13} color={textColor} style={{ opacity: 0.7 }} />
        )}
        <Pressable onPress={() => setDismissed(true)} hitSlop={12} style={S.closeBtn}>
          <Ionicons name="close" size={14} color={Colors.text3} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const S = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderLeftWidth: 3,
    borderRadius: 0,
    borderTopRightRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingLeft: 14,
    paddingVertical: 10,
  },
  barPressed: { opacity: 0.75 },
  message:    { ...Typography.bodySm, flex: 1, lineHeight: 19, fontWeight: '500' as const },
  right:      { alignItems: 'center', flexDirection: 'row', gap: 6 },
  closeBtn:   { padding: 2 },
});
