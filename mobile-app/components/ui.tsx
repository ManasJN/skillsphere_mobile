/**
 * SkillSphere UI Primitives — v3
 * Single source of truth. One file, one import path: @/components/ui
 *
 * Design principles:
 *  - No glow, no gradients, no decorative effects
 *  - Notion/Linear/Todoist feel — restrained, practical, human
 *  - Every component references only design tokens from @/lib/theme
 */

import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { usePressScale, useSkeletonPulse } from '@/hooks/useAnimations';

import { Colors, Control, Layout, Radius, Shadow, Spacing, Surface, Typography } from '@/lib/theme';

// ─── Card ─────────────────────────────────────────────────────────────────────

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Slight left-border accent — for reminders, warnings, highlights */
  accent?: boolean;
  /** Transparent background — for inline groupings that shouldn't look like cards */
  flat?: boolean;
};
export function Card({ children, style, accent, flat }: CardProps) {
  return (
    <View style={[S.card, accent && S.cardAccent, flat && S.cardFlat, style]}>
      {children}
    </View>
  );
}

export function Screen({
  children, style,
}: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[S.screen, style]}>{children}</View>;
}

export function Content({
  children, style,
}: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[S.content, style]}>{children}</View>;
}

// ─── Button ───────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tinted';
type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Compact size — for inline/card use */
  small?: boolean;
  /** Full-width */
  full?: boolean;
};
export function Button({
  label, onPress, variant = 'primary', loading, disabled, style, small, full,
}: ButtonProps) {
  const off = disabled || loading;
  const { scale, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Pressable
      disabled={off}
      onPress={onPress}
      onPressIn={off ? undefined : onPressIn}
      onPressOut={off ? undefined : onPressOut}>
      <Animated.View style={[
        S.btn,
        small && S.btnSm,
        full && S.btnFull,
        variant === 'primary'   && S.btnPrimary,
        variant === 'secondary' && S.btnSecondary,
        variant === 'ghost'     && S.btnGhost,
        variant === 'danger'    && S.btnDanger,
        variant === 'tinted'    && S.btnTinted,
        off && S.btnOff,
        style,
        { transform: [{ scale }] },
      ]}>
        {loading
          ? <ActivityIndicator color={variant === 'primary' ? Colors.bg1 : Colors.accent} size="small" />
          : <Text style={[
              S.btnTxt, small && S.btnTxtSm,
              variant === 'primary'   && S.btnTxtPrimary,
              variant === 'secondary' && S.btnTxtSecondary,
              variant === 'ghost'     && S.btnTxtGhost,
              variant === 'danger'    && S.btnTxtDanger,
              variant === 'tinted'    && S.btnTxtTinted,
            ]}>{label}</Text>}
      </Animated.View>
    </Pressable>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

type InputProps = {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  rightElement?: ReactNode;
};
export function Input({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, editable = true,
  multiline, numberOfLines, style, rightElement,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[S.inputWrap, style]}>
      {label ? <Text style={S.inputLabel}>{label}</Text> : null}
      <View style={[S.inputBox, focused && S.inputBoxFocused, !editable && S.inputBoxDisabled]}>
        <TextInput
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          editable={editable}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={Colors.text4}
          secureTextEntry={secureTextEntry}
          style={[S.inputText, multiline && S.inputMultiline]}
          value={value}
        />
        {rightElement ? <View style={S.inputRight}>{rightElement}</View> : null}
      </View>
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export type BadgeColor =
  'teal' | 'indigo' | 'amber' | 'red' | 'green' | 'muted' | 'blue' | 'pink' | 'orange';

type BadgeProps = {
  label: string;
  color?: BadgeColor;
  style?: StyleProp<ViewStyle>;
};
export function Badge({ label, color = 'muted', style }: BadgeProps) {
  return (
    <View style={[S.badge, badgeBg[color], style]}>
      <Text style={[S.badgeTxt, badgeFg[color]]}>{label}</Text>
    </View>
  );
}

// Muted, naturalistic badge tones — no neon
const badgeBg: Record<BadgeColor, ViewStyle> = {
  teal:   { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  indigo: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  amber:  { backgroundColor: Colors.status.warningBg, borderColor: Colors.status.warningBorder },
  red:    { backgroundColor: Colors.status.dangerBg, borderColor: Colors.status.dangerBorder },
  green:  { backgroundColor: Colors.status.successBg, borderColor: Colors.status.successBorder },
  muted:  { backgroundColor: Colors.bg4, borderColor: Colors.border1 },
  blue:   { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  pink:   { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  orange: { backgroundColor: Colors.status.warningBg, borderColor: Colors.status.warningBorder },
};
const badgeFg: Record<BadgeColor, TextStyle> = {
  teal:   { color: Colors.accentLight },
  indigo: { color: Colors.accentLight },
  amber:  { color: Colors.warning },
  red:    { color: Colors.danger },
  green:  { color: Colors.success },
  muted:  { color: Colors.text2 },
  blue:   { color: Colors.accentLight },
  pink:   { color: Colors.accentLight },
  orange: { color: Colors.warning },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

type AvatarProps = {
  initials: string;
  size?: number;
  bg?: string;
  textColor?: string;
};
export function Avatar({ initials, size = 44, bg, textColor }: AvatarProps) {
  return (
    <View style={[
      S.avatar,
      { width: size, height: size, borderRadius: Radius.sm },
      bg ? { backgroundColor: bg } : null,
    ]}>
      <Text style={[
        S.avatarTxt,
        { fontSize: Math.max(11, Math.floor(size * 0.32)) },
        textColor ? { color: textColor } : null,
      ]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

type EmptyStateProps = {
  icon?: string;
  /** Kept for backward-compat — rendered as text if passed */
  emoji?: string;
  title: string;
  body?: string;
  /** Optional CTA label + handler */
  action?: { label: string; onPress: () => void };
};
export function EmptyState({ icon, emoji, title, body, action }: EmptyStateProps) {
  const sym = icon ?? emoji;
  return (
    <View style={S.empty}>
      {sym ? <Text style={S.emptyIcon}>{sym}</Text> : null}
      <Text style={S.emptyTitle}>{title}</Text>
      {body ? <Text style={S.emptyBody}>{body}</Text> : null}
      {action ? (
        <Pressable onPress={action.onPress} style={S.emptyAction}>
          <Text style={S.emptyActionTxt}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};
export function SectionHeader({ title, actionLabel, onAction, style }: SectionHeaderProps) {
  return (
    <View style={[S.secHead, style]}>
      <Text style={S.secHeadTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={12}>
          <Text style={S.secHeadAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

type ProgressProps = {
  pct: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};
export function ProgressBar({ pct, color = Colors.accent, height = 5, style }: ProgressProps) {
  const w = `${Math.max(0, Math.min(100, pct))}%` as const;
  return (
    <View style={[S.progTrack, { height }, style]}>
      <View style={[S.progFill, { backgroundColor: color, width: w, height }]} />
    </View>
  );
}

// ─── StatTile — named StatChip for compat, but works as a proper stat tile ───

type StatTileProps = {
  label: string;
  value: string;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
  sub?: string;
};
export function StatChip({ label, value, accent, style, sub }: StatTileProps) {
  return (
    <View style={[S.statTile, accent && S.statTileAccent, style]}>
      <Text style={[S.statVal, accent && S.statValAccent]}>{value}</Text>
      <Text style={S.statLbl}>{label}</Text>
      {sub ? <Text style={S.statSub}>{sub}</Text> : null}
    </View>
  );
}
// Alias for new code
export const StatTile = StatChip;

// ─── GoalItem ─────────────────────────────────────────────────────────────────

type GoalItemProps = {
  title: string;
  progress: number;
  priority?: 'high' | 'medium' | 'low';
  deadline?: string;
  done?: boolean;
  onPress?: () => void;
};
export function GoalItem({ title, progress, priority, deadline, done, onPress }: GoalItemProps) {
  const pColor = priorityAccent(priority);
  const { scale, onPressIn, onPressOut } = usePressScale(0.98);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPress ? onPressIn : undefined}
      onPressOut={onPress ? onPressOut : undefined}>
      <Animated.View style={[S.goalItem, { transform: [{ scale }] }]}>
        {/* Left priority stripe */}
        <View style={[S.goalStripe, { backgroundColor: pColor }]} />
        <View style={S.goalBody}>
          <View style={S.goalTop}>
            <Text style={[S.goalTitle, done && S.goalTitleDone]} numberOfLines={1}>{title}</Text>
            {deadline ? <Text style={S.goalDate}>{deadline}</Text> : null}
          </View>
          {!done && (
            <View style={S.goalProgRow}>
              <ProgressBar pct={progress} color={pColor} height={3} style={{ flex: 1 }} />
              <Text style={[S.goalPct, { color: pColor }]}>{progress}%</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function priorityAccent(p?: string) {
  return { high: Colors.danger, medium: Colors.warning, low: Colors.success }[p ?? ''] ?? Colors.text3;
}

// ─── Row / Divider ────────────────────────────────────────────────────────────

export function Row({
  children, style,
}: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[S.row, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[S.divider, style]} />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

type SkeletonProps = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};
export function Skeleton({
  width = '100%', height = 14, radius = Radius.sm, style,
}: SkeletonProps) {
  const opacity = useSkeletonPulse();
  return (
    <Animated.View
      style={[S.skeleton, { width: width as number, height, borderRadius: radius, opacity }, style]}
    />
  );
}

export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[S.card, style, { gap: 10 }]}>
      <Skeleton height={13} width="55%" />
      <Skeleton height={10} width="90%" />
      <Skeleton height={10} width="70%" />
    </View>
  );
}

// ─── FadeView — simple fade-in wrapper ────────────────────────────────────────

/**
 * Wraps children in a fade-in Animated.View.
 * Use for sections/cards that appear after data loads.
 */
import { useFadeIn } from '@/hooks/useAnimations';
export function FadeView({
  children, delay = 0, style,
}: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const opacity = useFadeIn(delay);
  return (
    <Animated.View style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={S.errBanner}>
      <View style={S.errDot} />
      <Text style={S.errMsg}>{message}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: {
    ...Surface.screen,
    flex: 1,
  },
  content: {
    gap: Layout.screenGap,
    paddingHorizontal: Layout.screenPadding,
  },

  // Card
  card: {
    ...Surface.card,
    padding: Layout.cardPadding,
    ...Shadow.none,
  },
  cardAccent: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent,
    borderRadius: 0,
    borderTopRightRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  cardFlat: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
  },

  // Button
  btn: {
    alignItems: 'center',
    borderRadius: Radius.md,
    height: Control.buttonHeight,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  btnSm:   { height: Control.buttonSmallHeight, paddingHorizontal: Spacing.md, borderRadius: Radius.sm },
  btnFull: { width: '100%' },
  btnPrimary:   { backgroundColor: Colors.accent },
  btnSecondary: { ...Surface.inset },
  btnGhost:     { backgroundColor: 'transparent', borderColor: Colors.border2, borderWidth: 1 },
  btnDanger:    { ...Surface.danger },
  btnTinted:    { ...Surface.selected },
  btnOff:       { opacity: 0.4 },
  btnPressed:   { opacity: 0.75 },
  btnTxt:       { ...Typography.ui, color: Colors.text0 },
  btnTxtSm:     { fontSize: 13, fontWeight: '500' as const },
  btnTxtPrimary:   { color: Colors.bg1, fontWeight: '700' as const },
  btnTxtSecondary: { color: Colors.text0 },
  btnTxtGhost:     { color: Colors.accentLight },
  btnTxtDanger:    { color: Colors.danger },
  btnTxtTinted:    { color: Colors.accentLight },

  // Input
  inputWrap:        { gap: 6 },
  inputLabel:       { ...Typography.uiSm, color: Colors.text1, fontWeight: '500' as const },
  inputBox: {
    alignItems: 'center',
    ...Surface.inset,
    flexDirection: 'row',
  },
  inputBoxFocused:  { borderColor: Colors.accent },
  inputBoxDisabled: { opacity: 0.5 },
  inputText:        { ...Typography.body, color: Colors.text0, flex: 1, height: Control.inputHeight, paddingHorizontal: Spacing.md },
  inputMultiline:   { height: undefined, minHeight: 90, paddingTop: 13, textAlignVertical: 'top' },
  inputRight:       { paddingRight: 12 },

  // Badge
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTxt: {
    ...Typography.label,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'none' as const,
  },

  // Avatar
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accentMid,
  },
  avatarTxt: { color: Colors.accentLight, fontWeight: '600' as const },

  // EmptyState
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: 24 },
  emptyIcon:  { fontSize: 28, marginBottom: 2 },
  emptyTitle: { ...Typography.h4, color: Colors.text2, textAlign: 'center' },
  emptyBody:  { ...Typography.bodySm, color: Colors.text3, maxWidth: 260, textAlign: 'center', lineHeight: 19 },
  emptyAction: {
    borderColor:      Colors.border1,
    borderRadius:     Radius.sm,
    borderStyle:      'dashed' as const,
    borderWidth:      1,
    marginTop:        4,
    paddingHorizontal: 16,
    paddingVertical:   8,
  },
  emptyActionTxt: { ...Typography.uiSm, color: Colors.accent },

  // SectionHeader
  secHead:       { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  secHeadTitle:  { ...Typography.h3, color: Colors.text0 },
  secHeadAction: { ...Typography.uiSm, color: Colors.accent },

  // ProgressBar
  progTrack: { backgroundColor: Colors.bg4, borderRadius: Radius.full, overflow: 'hidden' },
  progFill:  { borderRadius: Radius.full },

  // StatTile
  statTile: {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: Spacing.md,
  },
  statTileAccent: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  statVal:        { ...Typography.statSm, color: Colors.text0 },
  statValAccent:  { color: Colors.accentLight },
  statLbl:        { ...Typography.bodyXs, color: Colors.text3, fontWeight: '500' as const },
  statSub:        { ...Typography.bodyXs, color: Colors.text3, marginTop: 2 },

  // GoalItem
  goalItem: {
    flexDirection: 'row',
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  goalItemPressed: { opacity: 0.75 },
  goalStripe: { width: 3 },
  goalBody:   { flex: 1, gap: 8, padding: 12 },
  goalTop:    { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  goalTitle:  { ...Typography.h4, color: Colors.text0, flex: 1 },
  goalTitleDone: { color: Colors.text3, textDecorationLine: 'line-through' as const },
  goalDate:   { ...Typography.bodyXs, color: Colors.text3 },
  goalProgRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalPct:    { ...Typography.bodyXs, fontWeight: '600' as const, minWidth: 30, textAlign: 'right' },

  // Row / Divider
  row:     { alignItems: 'center', flexDirection: 'row' },
  divider: { backgroundColor: Colors.border0, height: StyleSheet.hairlineWidth },

  // Skeleton
  skeleton: { backgroundColor: Colors.bg3 },

  // Error
  errBanner: {
    alignItems: 'flex-start',
    ...Surface.danger,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  errDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.danger, marginTop: 4, flexShrink: 0 },
  errMsg: { ...Typography.bodySm, color: Colors.danger, flex: 1, lineHeight: 19 },
});

