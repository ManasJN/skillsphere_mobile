/**
 * SkillSphere UI Primitives — v2
 * Pure React Native, zero external deps beyond the design system.
 */
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Colors, Radius, Shadow, Spacing, Typography } from '@/lib/theme';

// ─── Card ─────────────────────────────────────────────────────────────────────
type CardProps = { children: ReactNode; style?: ViewStyle; accent?: boolean; elevated?: boolean };
export function Card({ children, style, accent, elevated }: CardProps) {
  return (
    <View style={[S.card, elevated && S.cardElevated, accent && S.cardAccent, style]}>
      {children}
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tinted';
type ButtonProps = {
  label: string; onPress: () => void; variant?: BtnVariant;
  loading?: boolean; disabled?: boolean; style?: ViewStyle; small?: boolean;
};
export function Button({ label, onPress, variant = 'primary', loading, disabled, style, small }: ButtonProps) {
  const off = disabled || loading;
  return (
    <Pressable
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        S.btn, small && S.btnSm,
        variant === 'primary'   && S.btnPrimary,
        variant === 'secondary' && S.btnSecondary,
        variant === 'ghost'     && S.btnGhost,
        variant === 'danger'    && S.btnDanger,
        variant === 'tinted'    && S.btnTinted,
        off && S.btnOff,
        pressed && !off && S.btnPressed,
        style,
      ]}>
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? Colors.bg0 : Colors.accent} size="small" />
        : <Text style={[S.btnTxt, small && S.btnTxtSm,
            variant === 'primary'   && S.btnTxtPrimary,
            variant === 'secondary' && S.btnTxtSecondary,
            variant === 'ghost'     && S.btnTxtGhost,
            variant === 'danger'    && S.btnTxtDanger,
            variant === 'tinted'    && S.btnTxtTinted,
          ]}>{label}</Text>}
    </Pressable>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { TextInput } from 'react-native';
type InputProps = {
  label?: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'number-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences'; autoComplete?: string; editable?: boolean;
  multiline?: boolean; numberOfLines?: number; style?: ViewStyle;
  rightElement?: ReactNode;
};
export function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType,
  autoCapitalize, editable = true, multiline, numberOfLines, style, rightElement }: InputProps) {
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
export type BadgeColor = 'teal'|'indigo'|'amber'|'red'|'green'|'muted'|'blue'|'pink'|'orange';
type BadgeProps = { label: string; color?: BadgeColor; style?: ViewStyle };
export function Badge({ label, color = 'muted', style }: BadgeProps) {
  return (
    <View style={[S.badge, badgeBg[color], style]}>
      <Text style={[S.badgeTxt, badgeTxt[color]]}>{label}</Text>
    </View>
  );
}
const badgeBg: Record<BadgeColor, ViewStyle> = {
  teal:   { backgroundColor: Colors.accentDim,  borderColor: Colors.accentMid },
  indigo: { backgroundColor: Colors.xpMid,      borderColor: '#312E81' },
  amber:  { backgroundColor: '#1C1400',          borderColor: '#78350F' },
  red:    { backgroundColor: '#1C0000',          borderColor: '#7F1D1D' },
  green:  { backgroundColor: '#0A1F16',          borderColor: '#14532D' },
  muted:  { backgroundColor: Colors.bg4,         borderColor: Colors.border1 },
  blue:   { backgroundColor: '#0C1A2A',          borderColor: '#1E3A5F' },
  pink:   { backgroundColor: '#1F0A19',          borderColor: '#4A1942' },
  orange: { backgroundColor: '#1C0E00',          borderColor: '#7C2D12' },
};
const badgeTxt: Record<BadgeColor, TextStyle> = {
  teal:   { color: Colors.accentLight }, indigo: { color: Colors.xpLight },
  amber:  { color: '#FCD34D' },          red:    { color: '#FCA5A5' },
  green:  { color: '#6EE7B7' },          muted:  { color: Colors.text2 },
  blue:   { color: '#93C5FD' },          pink:   { color: '#F9A8D4' },
  orange: { color: '#FCA86C' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
type AvatarProps = { initials: string; size?: number; bg?: string; textColor?: string };
export function Avatar({ initials, size = 44, bg, textColor }: AvatarProps) {
  const r = size * 0.28;
  return (
    <View style={[S.avatar, { width: size, height: size, borderRadius: r }, bg ? { backgroundColor: bg } : null]}>
      <Text style={[S.avatarTxt, { fontSize: size * 0.34 }, textColor ? { color: textColor } : null]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
type EmptyStateProps = { emoji?: string; title: string; body?: string };
export function EmptyState({ emoji, title, body }: EmptyStateProps) {
  return (
    <View style={S.empty}>
      {emoji ? <Text style={S.emptyEmoji}>{emoji}</Text> : null}
      <Text style={S.emptyTitle}>{title}</Text>
      {body ? <Text style={S.emptyBody}>{body}</Text> : null}
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
type SectionHeaderProps = { title: string; actionLabel?: string; onAction?: () => void };
export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={S.secHead}>
      <Text style={S.secHeadTitle}>{title}</Text>
      {actionLabel && onAction
        ? <Pressable onPress={onAction} hitSlop={12}><Text style={S.secHeadAction}>{actionLabel}</Text></Pressable>
        : null}
    </View>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
type SkeletonProps = { width?: number | string; height?: number; radius?: number; style?: ViewStyle };
export function Skeleton({ width = '100%', height = 16, radius = Radius.sm, style }: SkeletonProps) {
  return <View style={[S.skeleton, { width: width as number, height, borderRadius: radius }, style]} />;
}
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[S.card, style, { gap: 12 }]}>
      <Skeleton height={14} width="60%" />
      <Skeleton height={10} width="90%" />
      <Skeleton height={10} width="75%" />
    </View>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
type ProgressProps = { pct: number; color?: string; height?: number; style?: ViewStyle };
export function ProgressBar({ pct, color = Colors.accent, height = 6, style }: ProgressProps) {
  const w = `${Math.max(0, Math.min(100, pct))}%`;
  return (
    <View style={[S.progTrack, { height }, style]}>
      <View style={[S.progFill, { backgroundColor: color, width: w, height }]} />
    </View>
  );
}

// ─── Row / Divider ────────────────────────────────────────────────────────────
export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[S.row, style]}>{children}</View>;
}
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[S.divider, style]} />;
}

// ─── StatChip ─────────────────────────────────────────────────────────────────
type StatChipProps = { label: string; value: string; accent?: boolean; style?: ViewStyle };
export function StatChip({ label, value, accent, style }: StatChipProps) {
  return (
    <View style={[S.statChip, accent && S.statChipAccent, style]}>
      <Text style={[S.statVal, accent && S.statValAccent]}>{value}</Text>
      <Text style={S.statLbl}>{label}</Text>
    </View>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={S.errBanner}>
      <Text style={S.errDot}>●</Text>
      <Text style={S.errMsg}>{message}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Card
  card: {
    backgroundColor: Colors.bg2, borderColor: Colors.border1, borderRadius: Radius.lg,
    borderWidth: 1, padding: Spacing.lg, ...Shadow.sm,
  },
  cardElevated: { backgroundColor: Colors.bg3, borderColor: Colors.border2, ...Shadow.md },
  cardAccent:   { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },

  // Button
  btn: { alignItems: 'center', borderRadius: Radius.md, height: 52, justifyContent: 'center', paddingHorizontal: 20 },
  btnSm: { height: 38, paddingHorizontal: 14, borderRadius: Radius.sm },
  btnPrimary:   { backgroundColor: Colors.accent, ...Shadow.accent },
  btnSecondary: { backgroundColor: Colors.bg3, borderColor: Colors.border2, borderWidth: 1 },
  btnGhost:     { backgroundColor: 'transparent', borderColor: Colors.border2, borderWidth: 1 },
  btnDanger:    { backgroundColor: '#1C0000', borderColor: '#7F1D1D', borderWidth: 1 },
  btnTinted:    { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid, borderWidth: 1 },
  btnOff:       { opacity: 0.4, shadowOpacity: 0 },
  btnPressed:   { opacity: 0.8, transform: [{ scale: 0.975 }] },
  btnTxt:       { ...Typography.ui },
  btnTxtSm:     { fontSize: 13, fontWeight: '600' },
  btnTxtPrimary:   { color: Colors.bg0, fontWeight: '800' },
  btnTxtSecondary: { color: Colors.text0 },
  btnTxtGhost:     { color: Colors.accentLight },
  btnTxtDanger:    { color: Colors.danger },
  btnTxtTinted:    { color: Colors.accentLight, fontWeight: '700' },

  // Input
  inputWrap:  { gap: 7 },
  inputLabel: { ...Typography.uiSm, color: Colors.text1, fontWeight: '600' },
  inputBox: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row',
  },
  inputBoxFocused:  { borderColor: Colors.accent },
  inputBoxDisabled: { opacity: 0.5 },
  inputText:        { color: Colors.text0, flex: 1, fontSize: 16, height: 52, paddingHorizontal: 14 },
  inputMultiline:   { height: undefined, minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  inputRight:       { paddingRight: 12 },

  // Badge
  badge: { alignSelf: 'flex-start', borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  badgeTxt: { ...Typography.label, fontSize: 10, letterSpacing: 0.7 },

  // Avatar
  avatar: { alignItems: 'center', backgroundColor: Colors.accentSoft, justifyContent: 'center' },
  avatarTxt: { color: Colors.accentLight, fontWeight: '800' },

  // Empty
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: 28 },
  emptyEmoji: { fontSize: 36, marginBottom: 4 },
  emptyTitle: { ...Typography.h3, color: Colors.text2, textAlign: 'center' },
  emptyBody:  { ...Typography.bodySm, color: Colors.text3, maxWidth: 260, textAlign: 'center', lineHeight: 20 },

  // Section Header
  secHead:       { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  secHeadTitle:  { ...Typography.h2, color: Colors.text0 },
  secHeadAction: { ...Typography.uiSm, color: Colors.accentLight },

  // Skeleton
  skeleton: { backgroundColor: Colors.bg3 },

  // Progress
  progTrack: { backgroundColor: Colors.bg4, borderRadius: Radius.full, overflow: 'hidden' },
  progFill:  { borderRadius: Radius.full },

  // Row / Divider
  row:     { alignItems: 'center', flexDirection: 'row' },
  divider: { backgroundColor: Colors.border0, height: 1 },

  // StatChip
  statChip:       { backgroundColor: Colors.bg3, borderColor: Colors.border1, borderRadius: Radius.md, borderWidth: 1, flex: 1, gap: 4, padding: Spacing.md },
  statChipAccent: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  statVal:        { ...Typography.statSm, color: Colors.text0 },
  statValAccent:  { color: Colors.accentLight },
  statLbl:        { ...Typography.bodySm, color: Colors.text3, fontWeight: '500' },

  // Error
  errBanner: { alignItems: 'flex-start', backgroundColor: '#1C0000', borderColor: '#7F1D1D', borderRadius: Radius.sm, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 12 },
  errDot:    { color: Colors.danger, fontSize: 10, marginTop: 3 },
  errMsg:    { ...Typography.bodySm, color: Colors.danger, flex: 1 },
});
