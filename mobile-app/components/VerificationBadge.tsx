/**
 * components/VerificationBadge.tsx
 *
 * Atomic badge for a single verification signal.
 *
 * Three size variants:
 *  - 'dot'    — 8×8 colored dot only (for inline next to a name)
 *  - 'icon'   — 14px icon only (for the compact hero row)
 *  - 'chip'   — icon + label text (for the details sheet / settings)
 *
 * Visual philosophy:
 *  - Verified:   colored icon, subtle tinted background
 *  - Unverified: muted icon, no background — barely visible
 *  - Pending:    muted amber icon, dashed border
 *
 * The component is intentionally small and self-contained.
 * It receives a VerificationSignal and renders accordingly.
 * It never manages state — purely presentational.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, Text, type StyleProp, type ViewStyle } from 'react-native';

import { VERIFICATION_CONFIG, type VerificationSignal, type VerificationStatus } from '@/lib/verification';
import { Colors, Radius, Typography } from '@/lib/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'dot' | 'icon' | 'chip';

type Props = {
  signal:   VerificationSignal;
  variant?: BadgeVariant;
  style?:   StyleProp<ViewStyle>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function VerificationBadge({ signal, variant = 'icon', style }: Props) {
  const cfg      = VERIFICATION_CONFIG[signal.kind];
  const verified = signal.status === 'verified';
  const pending  = signal.status === 'pending';
  const color    = verified ? cfg.color : pending ? Colors.warning : Colors.text4;
  const iconName = verified ? cfg.iconVerified : cfg.icon;

  if (variant === 'dot') {
    return (
      <View
        style={[
          S.dot,
          { backgroundColor: verified ? color : Colors.bg4, borderColor: verified ? color + '60' : Colors.border1 },
          style,
        ]}
      />
    );
  }

  if (variant === 'icon') {
    return (
      <View
        style={[
          S.iconWrap,
          verified && { backgroundColor: color + '18', borderColor: color + '40' },
          pending  && { backgroundColor: Colors.warning + '12', borderColor: Colors.warning + '30', borderStyle: 'dashed' as const },
          !verified && !pending && S.iconWrapMuted,
          style,
        ]}>
        <Ionicons
          name={iconName as any}
          size={12}
          color={color}
        />
      </View>
    );
  }

  // chip variant
  return (
    <View
      style={[
        S.chip,
        verified && { backgroundColor: color + '18', borderColor: color + '40' },
        pending  && { backgroundColor: Colors.warning + '12', borderColor: Colors.warning + '30', borderStyle: 'dashed' as const },
        !verified && !pending && S.chipMuted,
        style,
      ]}>
      <Ionicons name={iconName as any} size={12} color={color} />
      <Text style={[S.chipTxt, { color }]}>{cfg.shortLabel}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  dot: {
    width:        8,
    height:       8,
    borderRadius: Radius.full,
    borderWidth:  1,
  },

  iconWrap: {
    width:         22,
    height:        22,
    borderRadius:  Radius.full,
    borderWidth:   1,
    alignItems:    'center',
    justifyContent:'center',
    borderColor:   Colors.border1,
    backgroundColor: 'transparent',
  },
  iconWrapMuted: {
    borderColor:     Colors.border0,
    backgroundColor: 'transparent',
    opacity:         0.45,
  },

  chip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    borderRadius:    Radius.xs,
    borderWidth:     1,
    borderColor:     Colors.border1,
    paddingHorizontal: 8,
    paddingVertical:   4,
    backgroundColor: 'transparent',
  },
  chipMuted: {
    borderColor: Colors.border0,
    opacity:     0.5,
  },
  chipTxt: {
    ...Typography.bodyXs,
    fontWeight: '500',
  },
});
