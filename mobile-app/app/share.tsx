/**
 * app/share.tsx
 *
 * Share Portfolio screen — QR code + copy link + native share.
 *
 * Receives the same base64-encoded PortfolioData param as portfolio.tsx.
 * Decodes it, generates the portfolio URL, and renders three share actions:
 *
 *   1. QR Code (tap to enlarge in a modal — useful for in-person sharing)
 *   2. Copy link — uses react-native Share with single URL as fallback for
 *      clipboard (no expo-clipboard needed; behavior is equivalent on mobile)
 *   3. Native share sheet — react-native Share API, universally available
 *
 * Design:
 *  - Restrained dark aesthetic matching the rest of the app
 *  - QR code is the centrepiece, not an afterthought
 *  - Share actions below the QR, typographically labelled
 *  - No decorative elements, no gradients, no color-heavy backgrounds
 *
 * Navigation:
 *   router.push('/share?data=<base64_json>')
 *   — reached from portfolio.tsx header "Share" button
 *   — or directly from profile.tsx "Share Portfolio" action
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { QRCode } from '@/components/QRCode';
import { useFadeSlideIn, usePressScale } from '@/hooks/useAnimations';
import {
  generatePortfolioUrl,
  generateShareMessage,
  getPortfolioInitials,
  type PortfolioData,
} from '@/lib/portfolio';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { Divider, Row } from '@/components/ui';
import { VerificationBadge } from '@/components/VerificationBadge';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ShareScreen() {
  const { data: dataParam } = useLocalSearchParams<{ data?: string }>();
  const insets = useSafeAreaInsets();

  const portfolio = useMemo<PortfolioData | null>(() => {
    if (!dataParam) return null;
    try {
      const json =
        typeof atob !== 'undefined'
          ? atob(dataParam)
          : Buffer.from(dataParam, 'base64').toString('utf8');
      return JSON.parse(json) as PortfolioData;
    } catch {
      return null;
    }
  }, [dataParam]);

  const [qrZoomed,  setQrZoomed]  = useState(false);
  const [copyDone,  setCopyDone]  = useState(false);

  const { opacity, translateY } = useFadeSlideIn(0, 8);
  const qrAnim                  = useFadeSlideIn(80, 6);
  const actionsAnim             = useFadeSlideIn(160, 6);

  const { scale: backScale, onPressIn: backIn, onPressOut: backOut } = usePressScale(0.92);

  const portfolioUrl = portfolio ? generatePortfolioUrl(portfolio.userId) : '';

  // ── Copy link (via Share API single-URL shortcut) ──
  const handleCopyLink = useCallback(async () => {
    if (!portfolioUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // react-native Share with URL only — on most platforms this puts the
      // URL on the clipboard when the user selects "Copy" from the share sheet.
      // On iOS 16+ / Android 10+, Share.share with a URL pops a "Copy" option.
      await Share.share({ message: portfolioUrl, url: portfolioUrl });
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2500);
    } catch {
      // User dismissed — not an error
    }
  }, [portfolioUrl]);

  // ── Native share sheet ──
  const handleNativeShare = useCallback(async () => {
    if (!portfolio) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        title:   `${portfolio.name} — SkillSphere Portfolio`,
        message: generateShareMessage(portfolio),
        url:     portfolioUrl,   // iOS only — silently ignored on Android
      });
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        Alert.alert('Share failed', 'Could not open the share sheet. Please try again.');
      }
    }
  }, [portfolio, portfolioUrl]);

  // ── QR zoom toggle ──
  const handleQrPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQrZoomed(true);
  }, []);

  if (!portfolio) {
    return (
      <SafeAreaView edges={['top']} style={S.safe}>
        <View style={S.errorWrap}>
          <Text style={S.errorTxt}>Could not load portfolio data.</Text>
          <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <Text style={{ color: Colors.accent, ...Typography.bodySm }}>← Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const verifiedSigs = portfolio.verifications.filter(v => v.status === 'verified');

  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      {/* ── Top bar ── */}
      <Row style={S.topBar}>
        <Pressable onPress={() => router.back()} onPressIn={backIn} onPressOut={backOut} hitSlop={12}>
          <Animated.View style={[S.backBtn, { transform: [{ scale: backScale }] }]}>
            <Ionicons name="chevron-back" size={20} color={Colors.text2} />
          </Animated.View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={S.topBarTitle}>Share Portfolio</Text>
          <Text style={S.topBarSub}>{portfolio.name}</Text>
        </View>
      </Row>

      <Divider />

      <ScrollView
        contentContainerStyle={[S.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>

        {/* ── Identity summary ── */}
        <Animated.View style={[S.identityRow, { opacity, transform: [{ translateY }] }]}>
          <View style={S.initialsCircle}>
            <Text style={S.initialsText}>{getPortfolioInitials(portfolio.name)}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={S.identityName}>{portfolio.name}</Text>
            <Text style={S.identityRole}>
              {portfolio.role}{portfolio.college ? ` · ${portfolio.college}` : ''}
            </Text>
            {verifiedSigs.length > 0 && (
              <Row style={{ gap: 4, marginTop: 4 }}>
                {verifiedSigs.map(sig => (
                  <VerificationBadge key={sig.kind} signal={sig} variant="icon" />
                ))}
              </Row>
            )}
          </View>
        </Animated.View>

        {/* ── QR code ── */}
        <Animated.View style={[S.qrSection, { opacity: qrAnim.opacity, transform: [{ translateY: qrAnim.translateY }] }]}>
          <Text style={S.qrLabel}>SCAN TO VIEW PORTFOLIO</Text>

          <Pressable onPress={handleQrPress} style={S.qrWrap}>
            <QRCode
              value={portfolioUrl}
              size={200}
              darkColor={Colors.text0}
              quietZone={4}
            />
            <View style={S.qrHint}>
              <Ionicons name="expand-outline" size={12} color={Colors.text4} />
              <Text style={S.qrHintTxt}>Tap to expand</Text>
            </View>
          </Pressable>

          {/* URL below QR */}
          <View style={S.urlPill}>
            <Ionicons name="link-outline" size={12} color={Colors.text4} />
            <Text style={S.urlTxt} numberOfLines={1} selectable>{portfolioUrl}</Text>
          </View>
        </Animated.View>

        {/* ── Share actions ── */}
        <Animated.View style={[S.actionsSection, { opacity: actionsAnim.opacity, transform: [{ translateY: actionsAnim.translateY }] }]}>
          <Text style={S.actionsLabel}>SHARE VIA</Text>

          <View style={S.actionsList}>
            {/* Copy link */}
            <ShareAction
              icon={copyDone ? 'checkmark-circle' : 'copy-outline'}
              iconColor={copyDone ? Colors.success : Colors.text2}
              label={copyDone ? 'Link copied!' : 'Copy link'}
              description="Copy the portfolio URL to your clipboard"
              onPress={handleCopyLink}
            />

            <Divider style={S.actionDivider} />

            {/* Native share */}
            <ShareAction
              icon="share-outline"
              label="Share sheet"
              description="Open the system share menu"
              onPress={handleNativeShare}
            />

            <Divider style={S.actionDivider} />

            {/* View portfolio */}
            <ShareAction
              icon="eye-outline"
              label="Preview portfolio"
              description="See how your portfolio looks to others"
              onPress={() => router.push(`/portfolio?data=${dataParam}`)}
            />
          </View>
        </Animated.View>

        {/* ── Info note ── */}
        <View style={S.note}>
          <Ionicons name="information-circle-outline" size={13} color={Colors.text4} />
          <Text style={S.noteTxt}>
            Your portfolio is generated from your SkillSphere profile. Public hosting is coming soon.
          </Text>
        </View>

      </ScrollView>

      {/* ── QR Zoom Modal ── */}
      <QRZoomModal
        visible={qrZoomed}
        onClose={() => setQrZoomed(false)}
        url={portfolioUrl}
        name={portfolio.name}
      />
    </SafeAreaView>
  );
}

// ─── ShareAction row ──────────────────────────────────────────────────────────

type ShareActionProps = {
  icon:        string;
  iconColor?:  string;
  label:       string;
  description: string;
  onPress:     () => void;
};

function ShareAction({ icon, iconColor, label, description, onPress }: ShareActionProps) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.98);
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[S.actionRow, { transform: [{ scale }] }]}>
        <View style={S.actionIconWrap}>
          <Ionicons name={icon as any} size={18} color={iconColor ?? Colors.text2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={S.actionLabel}>{label}</Text>
          <Text style={S.actionDesc}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.text4} />
      </Animated.View>
    </Pressable>
  );
}

// ─── QR zoom modal ────────────────────────────────────────────────────────────

function QRZoomModal({
  visible, onClose, url, name,
}: { visible: boolean; onClose: () => void; url: string; name: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <Pressable style={S.modalOverlay} onPress={onClose}>
        <View style={[S.modalCard, { paddingBottom: insets.bottom + 24 }]}>
          {/* Handle */}
          <View style={S.modalHandle} />

          {/* Header */}
          <View style={S.modalHeaderRow}>
            <Text style={S.modalTitle}>{name}</Text>
            <Pressable onPress={onClose} hitSlop={16}>
              <Ionicons name="close" size={20} color={Colors.text3} />
            </Pressable>
          </View>

          <QRCode
            value={url}
            size={264}
            darkColor={Colors.text0}
            quietZone={4}
            style={S.modalQR}
          />

          <Text style={S.modalUrl} selectable numberOfLines={1}>{url}</Text>
          <Text style={S.modalHint}>Point a camera at this code to open the portfolio</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:    { backgroundColor: Colors.bg1, flex: 1 },
  // More generous top spacing, structured gap between sections
  content: { gap: 20, paddingHorizontal: Spacing.lg, paddingTop: 22 },

  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorTxt:  { ...Typography.h4, color: Colors.text3 },

  // Top bar — consistent with portfolio.tsx
  topBar: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  backBtn:    { padding: 4, marginLeft: -4 },
  topBarTitle:{ ...Typography.h4, color: Colors.text0 },
  topBarSub:  { ...Typography.bodyXs, color: Colors.text4, marginTop: 2 },

  // Identity card — slightly more padding, consistent border radius
  identityRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    backgroundColor: Colors.bg2,
    borderColor:     Colors.border1,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    padding:         16,
  },
  initialsCircle: {
    width:           44,
    height:          44,
    borderRadius:    Radius.full,
    backgroundColor: Colors.accentSoft,
    borderColor:     Colors.accentMid,
    borderWidth:     1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  initialsText: {
    ...Typography.h4,
    color:         Colors.accentLight,
    letterSpacing: 1,
    fontWeight:    '700',
  },
  identityName: { ...Typography.h4, color: Colors.text0 },
  identityRole: { ...Typography.bodyXs, color: Colors.text3, marginTop: 2 },

  // QR section — centred, comfortable padding
  qrSection: {
    alignItems: 'center',
    gap:        14,
  },
  qrLabel: {
    ...Typography.label,
    color:         Colors.text4,
    letterSpacing: 0.8,
    alignSelf:     'flex-start',
  },
  qrWrap: {
    alignItems:      'center',
    backgroundColor: Colors.bg2,
    borderColor:     Colors.border1,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    gap:             12,
    paddingHorizontal: 20,
    paddingTop:      20,
    paddingBottom:   16,
    width:           '100%',
  },
  qrHint: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  qrHintTxt: { ...Typography.bodyXs, color: Colors.text4 },

  // URL pill — full width, monospace URL for readability
  urlPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    backgroundColor:   Colors.bg3,
    borderColor:       Colors.border1,
    borderRadius:      Radius.sm,
    borderWidth:       1,
    paddingHorizontal: 12,
    paddingVertical:   9,
    width:             '100%',
  },
  urlTxt: {
    ...Typography.bodyXs,
    color:      Colors.text3,
    flex:       1,
    fontFamily: undefined, // system monospace-ish
  },

  // Actions section
  actionsSection: { gap: 8 },
  actionsLabel: {
    ...Typography.label,
    color:         Colors.text4,
    letterSpacing: 0.8,
  },
  actionsList: {
    backgroundColor: Colors.bg2,
    borderColor:     Colors.border1,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    overflow:        'hidden',
  },
  // Indent divider to align with text, not icon
  actionDivider: { marginLeft: 58 },
  actionRow: {
    alignItems:        'center',
    flexDirection:     'row',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  actionIconWrap: {
    width:           34,
    height:          34,
    borderRadius:    Radius.md,
    backgroundColor: Colors.bg3,
    borderColor:     Colors.border1,
    borderWidth:     1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  actionLabel: { ...Typography.bodySm, color: Colors.text0, fontWeight: '600' },
  actionDesc:  { ...Typography.bodyXs, color: Colors.text3, marginTop: 1 },

  // Note — subtle, bottom of screen
  note: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            7,
    paddingVertical: 4,
    opacity:        0.7,
  },
  noteTxt: {
    ...Typography.bodyXs,
    color:      Colors.text4,
    flex:       1,
    lineHeight: 18,
  },

  // QR zoom modal
  modalOverlay: {
    flex:            1,
    backgroundColor: Colors.overlay,
    alignItems:      'center',
    justifyContent:  'flex-end',
  },
  modalCard: {
    backgroundColor:      Colors.bg2,
    borderTopLeftRadius:  Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderColor:          Colors.border1,
    borderWidth:          1,
    paddingHorizontal:    24,
    paddingTop:           20,
    width:                '100%',
    alignItems:           'center',
    gap:                  12,
  },
  modalHandle: {
    width:           36,
    height:          4,
    borderRadius:    Radius.full,
    backgroundColor: Colors.border2,
    marginBottom:    4,
  },
  modalHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: { ...Typography.h4, color: Colors.text0 },
  modalQR: {
    borderRadius: Radius.lg,
    overflow:     'hidden',
  },
  modalUrl: {
    ...Typography.bodyXs,
    color:     Colors.text3,
    textAlign: 'center',
  },
  modalHint: {
    ...Typography.bodyXs,
    color:     Colors.text4,
    textAlign: 'center',
    marginBottom: 4,
  },
});
