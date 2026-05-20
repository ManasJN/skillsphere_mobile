import { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { Colors, Radius, Shadow, Typography } from '@/lib/theme';

const badgeColors = {
  teal: { background: '#043737', text: '#7DD3FC' },
  indigo: { background: '#1E1B4A', text: '#C7D2FE' },
  blue: { background: '#0D3B66', text: '#BFDBFE' },
  green: { background: '#052E14', text: '#86EFAC' },
  amber: { background: '#4C2A05', text: '#FCD34D' },
  red: { background: '#4C0505', text: '#FCA5A5' },
  muted: { background: Colors.bg3, text: Colors.text3 },
};

type BadgeColor = keyof typeof badgeColors;

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({
  label,
  color = 'muted',
  style,
}: {
  label: string;
  color?: BadgeColor;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = badgeColors[color] ?? badgeColors.muted;
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }, style]}>
      <Text style={[styles.badgeText, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function Row({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function EmptyState({
  emoji,
  title,
  body,
  style,
  titleStyle,
  bodyStyle,
}: {
  emoji?: string;
  title: string;
  body?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  bodyStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[styles.emptyState, style]}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyEmoji}>{emoji ?? '✨'}</Text>
      </View>
      <Text style={[styles.emptyTitle, titleStyle]}>{title}</Text>
      {body ? <Text style={[styles.emptyBody, bodyStyle]}>{body}</Text> : null}
    </View>
  );
}

export function Avatar({
  initials,
  size = 48,
  style,
}: {
  initials: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.avatarText, { fontSize: Math.max(14, size / 2.8) }]}>{initials}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function ProgressBar({
  pct,
  color = Colors.accent,
  height = 6,
  style,
}: {
  pct: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = Math.min(100, Math.max(0, pct));
  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color, height }]} />
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StatChip({
  label,
  value,
  accent,
  style,
}: {
  label: string;
  value: string;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.statChip, accent && styles.statChipAccent, style]}>
      <Text style={[styles.statChipValue, accent && styles.statChipValueAccent]}>{value}</Text>
      <Text style={[styles.statChipLabel, accent && styles.statChipLabelAccent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 26,
    justifyContent: 'center',
  },
  badgeText: {
    ...Typography.bodySm,
    color: Colors.text0,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderColor: Colors.border0,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: Colors.bg4,
    borderRadius: Radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  emptyEmoji: { fontSize: 24 },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text0,
    textAlign: 'center',
  },
  emptyBody: {
    ...Typography.bodySm,
    color: Colors.text3,
    textAlign: 'center',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.bg4,
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.text0,
    fontWeight: '800',
  },
  divider: {
    backgroundColor: Colors.border0,
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  progressTrack: {
    backgroundColor: Colors.bg4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text0,
  },
  sectionAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sectionActionText: {
    ...Typography.uiSm,
    color: Colors.accentLight,
  },
  statChip: {
    alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statChipAccent: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  statChipValue: {
    ...Typography.statSm,
    color: Colors.text0,
  },
  statChipValueAccent: {
    color: Colors.accentLight,
  },
  statChipLabel: {
    ...Typography.bodySm,
    color: Colors.text3,
    marginTop: 4,
  },
  statChipLabelAccent: {
    color: Colors.text3,
  },
});

// Re-export a few newer UI primitives implemented in `app-ui.tsx`
// so `@/components/ui` remains the single import surface used across screens.
export { Skeleton, SkeletonCard, ErrorBanner } from './app-ui';
