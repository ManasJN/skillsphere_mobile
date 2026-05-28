/**
 * components/VerificationRow.tsx
 *
 * Compact trust indicator row for the profile hero card.
 * Shows verified signals as small icon badges in a row.
 * Tapping opens an inline details sheet listing all signals
 * with their status and description.
 *
 * Visual hierarchy:
 *  - When nothing is verified: hidden entirely (returns null)
 *  - 1–2 verified: shows badges + "N verified" label
 *  - 3–4 verified: shows badges + "Fully verified" label
 *
 * The details sheet slides up from the bottom as a Modal (same
 * pattern as GoalSheet/TimelineSheet — no new animation libraries).
 *
 * Keeps its own sheet open/close state internally — the parent
 * just renders <VerificationRow signals={signals} /> and nothing else.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VerificationBadge } from '@/components/VerificationBadge';
import { useFadeSlideIn, usePressScale } from '@/hooks/useAnimations';
import {
  VERIFICATION_CONFIG,
  countVerified,
  type VerificationSignal,
} from '@/lib/verification';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { Divider, Row } from '@/components/ui';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  /** All four signals (verified + unverified). Use deriveVerifications(user). */
  signals: VerificationSignal[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export function VerificationRow({ signals }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const verified   = signals.filter(s => s.status === 'verified');
  const count      = verified.length;

  // Don't render anything if nothing is verified yet
  if (count === 0) return null;

  const label = count === signals.length ? 'Fully verified' : `${count} verified`;

  return (
    <>
      <VerificationRowContent
        signals={signals}
        verifiedCount={count}
        label={label}
        onPress={() => setSheetOpen(true)}
      />
      <VerificationSheet
        signals={signals}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

// ─── Row content — separated to avoid re-render from sheetOpen state ─────────

type RowContentProps = {
  signals:       VerificationSignal[];
  verifiedCount: number;
  label:         string;
  onPress:       () => void;
};

function VerificationRowContent({ signals, verifiedCount, label, onPress }: RowContentProps) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.95);
  const verified = signals.filter(s => s.status === 'verified');

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[S.row, { transform: [{ scale }] }]}>
        {/* Icon badges — only verified ones */}
        <Row style={S.badgeRow}>
          {verified.map(signal => (
            <VerificationBadge
              key={signal.kind}
              signal={signal}
              variant="icon"
            />
          ))}
        </Row>

        {/* Label + chevron */}
        <Row style={S.labelRow}>
          <Text style={[
            S.label,
            verifiedCount === signals.length && { color: Colors.success },
          ]}>
            {label}
          </Text>
          <Ionicons name="chevron-forward" size={11} color={Colors.text4} />
        </Row>
      </Animated.View>
    </Pressable>
  );
}

// ─── Details sheet ────────────────────────────────────────────────────────────

type SheetProps = {
  signals: VerificationSignal[];
  visible: boolean;
  onClose: () => void;
};

function VerificationSheet({ signals, visible, onClose }: SheetProps) {
  const insets       = useSafeAreaInsets();
  const verifiedCount = countVerified(signals);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}>
      <View style={[S.sheet, { paddingBottom: insets.bottom + 16 }]}>

        {/* Sheet handle */}
        <View style={S.handle} />

        {/* Header */}
        <Row style={S.sheetHeader}>
          <View>
            <Text style={S.sheetTitle}>Trust Indicators</Text>
            <Text style={S.sheetSub}>
              {verifiedCount} of {signals.length} verified
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={S.closeBtn}>
            <Ionicons name="close" size={18} color={Colors.text3} />
          </Pressable>
        </Row>

        <Divider style={{ marginHorizontal: Spacing.lg }} />

        {/* Signal list */}
        <ScrollView
          contentContainerStyle={S.sheetBody}
          showsVerticalScrollIndicator={false}>

          <Text style={S.sheetIntro}>
            Verified signals make your profile more trustworthy to collaborators,
            recruiters, and opportunities on SkillSphere.
          </Text>

          {signals.map((signal, i) => (
            <SignalRow
              key={signal.kind}
              signal={signal}
              isLast={i === signals.length - 1}
            />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Individual signal row in the sheet ──────────────────────────────────────

function SignalRow({ signal, isLast }: { signal: VerificationSignal; isLast: boolean }) {
  const cfg      = VERIFICATION_CONFIG[signal.kind];
  const verified = signal.status === 'verified';
  const pending  = signal.status === 'pending';
  const color    = verified ? cfg.color : pending ? Colors.warning : Colors.text4;

  // Fade-in each row with slight stagger would be nice, but skip to keep
  // the sheet feeling instant. The modal slide animation is sufficient.

  return (
    <View>
      <Row style={S.signalRow}>
        {/* Chip badge */}
        <VerificationBadge signal={signal} variant="icon" />

        {/* Info */}
        <View style={S.signalBody}>
          <Row style={S.signalTop}>
            <Text style={S.signalLabel}>{cfg.shortLabel}</Text>
            <StatusPill status={signal.status} />
          </Row>
          <Text style={S.signalDesc}>{signal.description}</Text>
          {signal.value && verified && (
            <Text style={[S.signalValue, { color }]} numberOfLines={1}>
              {signal.value}
            </Text>
          )}
        </View>
      </Row>
      {!isLast && <Divider style={S.signalDivider} />}
    </View>
  );
}

// ─── Status pill — "Verified" / "Pending" / "Not connected" ──────────────────

function StatusPill({ status }: { status: VerificationSignal['status'] }) {
  const config = {
    verified:   { label: 'Verified',       color: Colors.success,  bg: Colors.status.successBg,  border: Colors.status.successBorder },
    pending:    { label: 'Pending',         color: Colors.warning,  bg: Colors.status.warningBg,  border: Colors.status.warningBorder },
    unverified: { label: 'Not connected',   color: Colors.text4,    bg: Colors.bg3,               border: Colors.border1 },
  }[status];

  return (
    <View style={[S.pill, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[S.pillTxt, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Row
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  badgeRow: {
    gap: 4,
  },
  labelRow: {
    gap:        3,
    alignItems: 'center',
  },
  label: {
    ...Typography.bodyXs,
    color:      Colors.text3,
    fontWeight: '500',
  },

  // Sheet
  sheet: {
    backgroundColor: Colors.bg1,
    flex:            1,
  },
  handle: {
    alignSelf:       'center',
    backgroundColor: Colors.border2,
    borderRadius:    Radius.full,
    height:          4,
    marginTop:       10,
    marginBottom:    14,
    width:           36,
  },
  sheetHeader: {
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom:     Spacing.md,
  },
  sheetTitle: {
    ...Typography.h3,
    color: Colors.text0,
  },
  sheetSub: {
    ...Typography.bodyXs,
    color:     Colors.text3,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    gap:              0,
    paddingHorizontal: Spacing.lg,
    paddingTop:       Spacing.lg,
    paddingBottom:    Spacing.xxxl,
  },
  sheetIntro: {
    ...Typography.bodySm,
    color:        Colors.text3,
    lineHeight:   20,
    marginBottom: Spacing.lg,
  },

  // Signal rows in sheet
  signalRow: {
    gap:            14,
    alignItems:     'flex-start',
    paddingVertical: 14,
  },
  signalBody: {
    flex: 1,
    gap:  4,
  },
  signalTop: {
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  signalLabel: {
    ...Typography.h4,
    color: Colors.text0,
    flex:  1,
  },
  signalDesc: {
    ...Typography.bodyXs,
    color:      Colors.text2,
    lineHeight: 17,
  },
  signalValue: {
    ...Typography.bodyXs,
    fontWeight: '500',
    marginTop:  2,
  },
  signalDivider: {
    marginLeft: 36,   // aligns with text, skips icon column
  },

  // Status pill
  pill: {
    borderRadius:     Radius.xs,
    borderWidth:      1,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  pillTxt: {
    ...Typography.bodyXs,
    fontWeight: '500',
  },
});
