/**
 * app/portfolio.tsx
 *
 * Portfolio preview screen — read-only presentation mode.
 *
 * Receives a serialised PortfolioData object via expo-router params
 * (JSON string, base64 encoded to avoid URL encoding issues).
 *
 * Design:
 *  - Typography-first, developer journal feel
 *  - Same dark theme as the rest of the app
 *  - Sections: Identity → Verifications → Skills → Timeline → Projects → Links
 *  - No edit affordances — pure presentation
 *  - "Share" button in header opens share.tsx
 *
 * Navigation:
 *   router.push('/portfolio?data=<base64_json>')
 *
 * Future public portfolio:
 *   When backend hosts /u/:userId, this screen serves as the in-app
 *   equivalent. A `userId` param mode can fetch fresh data from the
 *   public API and render identically.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VerificationBadge } from '@/components/VerificationBadge';
import { useFadeSlideIn, usePressScale } from '@/hooks/useAnimations';
import { Animated } from 'react-native';
import {
  getPortfolioHeadline,
  getPortfolioInitials,
  generatePortfolioUrl,
  type PortfolioData,
} from '@/lib/portfolio';
import { CATEGORY_CONFIG, formatTimelineDate } from '@/lib/timeline';
import { Colors, NAV_BOTTOM_OFFSET, Radius, Spacing, Typography } from '@/lib/theme';
import { Avatar, Badge, Divider, ProgressBar, Row } from '@/components/ui';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PortfolioScreen() {
  const { data: dataParam } = useLocalSearchParams<{ data?: string }>();

  const portfolio = useMemo<PortfolioData | null>(() => {
    if (!dataParam) return null;
    try {
      return JSON.parse(
        typeof atob !== 'undefined'
          ? atob(dataParam)
          : Buffer.from(dataParam, 'base64').toString('utf8')
      ) as PortfolioData;
    } catch {
      return null;
    }
  }, [dataParam]);

  const { opacity, translateY } = useFadeSlideIn(0, 6);
  const { scale: shareScale, onPressIn: shareIn, onPressOut: shareOut } = usePressScale(0.95);
  const { scale: backScale, onPressIn: backIn, onPressOut: backOut } = usePressScale(0.92);

  const openShare = useCallback(() => {
    if (!dataParam) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/share?data=${dataParam}`);
  }, [dataParam]);

  if (!portfolio) {
    return (
      <SafeAreaView edges={['top']} style={S.safe}>
        <View style={S.errorWrap}>
          <Text style={S.errorTxt}>Could not load portfolio.</Text>
          <Pressable onPress={() => router.back()} style={S.backLink}>
            <Text style={S.backLinkTxt}>← Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const headline      = getPortfolioHeadline(portfolio);
  const initials      = getPortfolioInitials(portfolio.name);
  const verifiedSigs  = portfolio.verifications.filter(v => v.status === 'verified');
  const portfolioUrl  = generatePortfolioUrl(portfolio.userId);
  const hasCoding     = Object.values(portfolio.codingStats).some(v => (v as number) > 0);

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
          <Text style={S.topBarTitle} numberOfLines={1}>{portfolio.name}</Text>
          <Text style={S.topBarSub}>Portfolio preview</Text>
        </View>
        <Pressable onPress={openShare} onPressIn={shareIn} onPressOut={shareOut}>
          <Animated.View style={[S.shareBtn, { transform: [{ scale: shareScale }] }]}>
            <Ionicons name="share-outline" size={14} color={Colors.accent} />
            <Text style={S.shareBtnTxt}>Share</Text>
          </Animated.View>
        </Pressable>
      </Row>

      <Divider />

      <ScrollView
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}>

        {/* ── Identity section ── */}
        <Animated.View style={[S.hero, { opacity, transform: [{ translateY }] }]}>
          <Row style={S.heroTop}>
            <Avatar initials={initials} size={64} />
            <View style={S.heroMeta}>
              <Text style={S.heroName}>{portfolio.name}</Text>
              <Text style={S.heroHeadline}>{headline}</Text>
              {portfolio.bio ? (
                <Text style={S.heroBio}>{portfolio.bio}</Text>
              ) : null}
              <Row style={{ gap: 6, marginTop: 6 }}>
                <Badge
                  label={portfolio.role}
                  color={portfolio.role === 'faculty' ? 'indigo' : 'teal'}
                />
                {portfolio.level > 1 && (
                  <Badge label={`Level ${portfolio.level}`} color="blue" />
                )}
              </Row>
            </View>
          </Row>

          {/* Verification strip — only verified signals */}
          {verifiedSigs.length > 0 && (
            <Row style={S.verifyStrip}>
              {verifiedSigs.map(sig => (
                <VerificationBadge key={sig.kind} signal={sig} variant="chip" />
              ))}
            </Row>
          )}

          {/* Portfolio URL */}
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync(portfolioUrl)}
            style={S.urlRow}>
            <Ionicons name="link-outline" size={12} color={Colors.text4} />
            <Text style={S.urlTxt} numberOfLines={1}>{portfolioUrl}</Text>
          </Pressable>
        </Animated.View>

        {/* ── Skills ── */}
        {portfolio.skills.length > 0 && (
          <PortfolioSection title="Skills" delay={60}>
            <View style={S.skillsGrid}>
              {portfolio.skills.slice(0, 8).map((sk, i) => (
                <View key={i} style={S.skillRow}>
                  <View style={[S.skillDot, { backgroundColor: skillColor(sk.category) }]} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={S.skillName} numberOfLines={1}>{sk.name}</Text>
                      <Text style={[S.skillPct, { color: skillColor(sk.category) }]}>
                        {sk.level}%
                      </Text>
                    </Row>
                    <ProgressBar pct={sk.level} color={skillColor(sk.category)} height={3} />
                  </View>
                </View>
              ))}
            </View>
          </PortfolioSection>
        )}

        {/* ── Timeline ── */}
        {portfolio.timeline.length > 0 && (
          <PortfolioSection title="Timeline" delay={80}>
            <View>
              {portfolio.timeline.slice(0, 6).map((entry, i) => {
                const cfg    = CATEGORY_CONFIG[entry.category];
                const isLast = i === Math.min(portfolio.timeline.length, 6) - 1;
                return (
                  <View key={entry.id} style={S.tlRow}>
                    {/* Rail */}
                    <View style={S.tlRail}>
                      <View style={[S.tlDot, { backgroundColor: cfg.color }]}>
                        <Ionicons name={cfg.icon as any} size={9} color={Colors.bg1} />
                      </View>
                      {!isLast && <View style={S.tlLine} />}
                    </View>
                    {/* Content */}
                    <View style={[S.tlContent, !isLast && { paddingBottom: 16 }]}>
                      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={S.tlTitle} numberOfLines={1}>{entry.title}</Text>
                        <Text style={S.tlDate}>{formatTimelineDate(entry.date, entry.endDate)}</Text>
                      </Row>
                      {entry.organisation && (
                        <Text style={S.tlOrg}>{entry.organisation}</Text>
                      )}
                      <View style={[S.tlChip, { borderColor: cfg.color + '40' }]}>
                        <Text style={[S.tlChipTxt, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                      {entry.description && (
                        <Text style={S.tlDesc} numberOfLines={2}>{entry.description}</Text>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <Row style={S.tlTags}>
                          {entry.tags.slice(0, 4).map(tag => (
                            <View key={tag} style={S.tlTag}>
                              <Text style={S.tlTagTxt}>{tag}</Text>
                            </View>
                          ))}
                        </Row>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </PortfolioSection>
        )}

        {/* ── Projects ── */}
        {portfolio.projects.length > 0 && (
          <PortfolioSection title="Projects" delay={100}>
            <View style={{ gap: 10 }}>
              {portfolio.projects.slice(0, 4).map((p, i) => (
                <View key={i} style={S.projCard}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={S.projTitle} numberOfLines={1}>{p.title}</Text>
                    <Badge label={p.status} color={projBadge(p.status)} />
                  </Row>
                  {p.description ? (
                    <Text style={S.projDesc} numberOfLines={2}>{p.description}</Text>
                  ) : null}
                  {p.techStack.length > 0 && (
                    <Row style={{ flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                      {p.techStack.slice(0, 5).map(t => (
                        <View key={t} style={S.tag}>
                          <Text style={S.tagTxt}>{t}</Text>
                        </View>
                      ))}
                    </Row>
                  )}
                </View>
              ))}
            </View>
          </PortfolioSection>
        )}

        {/* ── Coding stats ── */}
        {hasCoding && (
          <PortfolioSection title="Coding" delay={120}>
            <Row style={{ flexWrap: 'wrap', gap: 8 }}>
              {[
                ['Solved',    portfolio.codingStats.leetcodeSolved,    Colors.accentLight],
                ['Easy',      portfolio.codingStats.leetcodeEasy,      Colors.success],
                ['Medium',    portfolio.codingStats.leetcodeMedium,    Colors.warning],
                ['Hard',      portfolio.codingStats.leetcodeHard,      Colors.danger],
                ['CF Rating', portfolio.codingStats.codeforcesRating,  Colors.accent],
                ['Repos',     portfolio.codingStats.githubRepos,       Colors.text2],
              ]
                .filter(([, v]) => v && (v as number) > 0)
                .map(([lbl, val, clr]) => (
                  <View key={String(lbl)} style={S.codingCell}>
                    <Text style={[S.codingVal, { color: String(clr) }]}>{String(val)}</Text>
                    <Text style={S.codingLbl}>{String(lbl)}</Text>
                  </View>
                ))}
            </Row>
          </PortfolioSection>
        )}

        {/* ── Social / Links ── */}
        {Object.values(portfolio.socialLinks).some(Boolean) && (
          <PortfolioSection title="Links" delay={140}>
            <View style={{ gap: 10 }}>
              {Object.entries(portfolio.socialLinks)
                .filter(([, v]) => v)
                .map(([platform, link]) => (
                  <Pressable
                    key={platform}
                    onPress={() => WebBrowser.openBrowserAsync(
                      String(link).startsWith('http') ? String(link) : `https://${link}`
                    )}
                    style={S.linkRow}>
                    <Ionicons name="open-outline" size={13} color={Colors.text3} />
                    <Text style={S.linkPlatform}>{platform}</Text>
                    <Text style={S.linkUrl} numberOfLines={1}>
                      {String(link).replace(/^https?:\/\//, '')}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </PortfolioSection>
        )}

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerTxt}>Built with SkillSphere</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function PortfolioSection({
  title, children, delay = 0,
}: { title: string; children: React.ReactNode; delay?: number }) {
  const { opacity, translateY } = useFadeSlideIn(delay, 6);
  return (
    <Animated.View style={[S.section, { opacity, transform: [{ translateY }] }]}>
      <Text style={S.sectionTitle}>{title}</Text>
      <Divider style={{ marginBottom: 12 }} />
      {children}
    </Animated.View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function skillColor(cat = '') {
  return (Colors.skill as Record<string, string>)[cat] ?? Colors.skill.default;
}

function projBadge(s?: string): Parameters<typeof Badge>[0]['color'] {
  return ({ completed:'green', ongoing:'teal', planned:'indigo', abandoned:'red', active:'teal' } as const)[s ?? ''] ?? 'muted';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:    { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 0, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 18 },

  // Error state
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorTxt:  { ...Typography.h4, color: Colors.text3 },
  backLink:  { padding: 8 },
  backLinkTxt: { ...Typography.bodySm, color: Colors.accent },

  // Top bar
  topBar: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 2,
  },
  topBarTitle: { ...Typography.h4, color: Colors.text0 },
  topBarSub:   { ...Typography.bodyXs, color: Colors.text4, marginTop: 1 },
  shareBtn: {
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid,
    borderRadius: Radius.xs,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shareBtnTxt: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' },

  // Hero
  hero: {
    gap: 12,
    paddingBottom: 20,
  },
  heroTop:     { gap: 14, alignItems: 'flex-start' },
  heroMeta:    { flex: 1, gap: 3 },
  heroName:    { ...Typography.h2, color: Colors.text0 },
  heroHeadline:{ ...Typography.bodySm, color: Colors.text2 },
  heroBio:     { ...Typography.bodySm, color: Colors.text3, lineHeight: 19, marginTop: 4 },

  verifyStrip: { flexWrap: 'wrap', gap: 6, marginTop: 4 },

  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  urlTxt: {
    ...Typography.bodyXs,
    color: Colors.text4,
    flex: 1,
  },

  // Section
  section: {
    borderTopWidth: 1,
    borderTopColor: Colors.border0,
    paddingTop: 18,
    paddingBottom: 6,
    gap: 0,
  },
  sectionTitle: { ...Typography.h3, color: Colors.text0, marginBottom: 8 },

  // Skills
  skillsGrid: { gap: 10 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skillDot: { width: 8, height: 8, borderRadius: 4 },
  skillName: { ...Typography.bodySm, color: Colors.text1, flex: 1 },
  skillPct:  { ...Typography.mono, fontWeight: '700' },

  // Timeline
  tlRow: { flexDirection: 'row', gap: 12 },
  tlRail: { width: 18, alignItems: 'center' },
  tlDot: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tlLine: {
    flex: 1, width: 1, backgroundColor: Colors.border1,
    marginTop: 4, minHeight: 16,
  },
  tlContent: { flex: 1, gap: 4 },
  tlTitle:   { ...Typography.h4, color: Colors.text0, flex: 1 },
  tlDate:    { ...Typography.bodyXs, color: Colors.text3, flexShrink: 0 },
  tlOrg:     { ...Typography.bodyXs, color: Colors.text3, fontStyle: 'italic' },
  tlChip: {
    alignSelf: 'flex-start', borderRadius: Radius.xs, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  tlChipTxt: { ...Typography.bodyXs, fontWeight: '500' },
  tlDesc:    { ...Typography.bodyXs, color: Colors.text2, lineHeight: 17 },
  tlTags:    { flexWrap: 'wrap', gap: 5 },
  tlTag: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.xs, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  tlTagTxt: { ...Typography.bodyXs, color: Colors.text2 },

  // Projects
  projCard: {
    backgroundColor: Colors.bg3, borderColor: Colors.border0,
    borderRadius: Radius.md, borderWidth: 1, gap: 6, padding: 12,
  },
  projTitle: { ...Typography.h4, color: Colors.text0, flex: 1 },
  projDesc:  { ...Typography.bodySm, color: Colors.text2, lineHeight: 18 },

  // Coding
  codingCell: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.sm, borderWidth: 1, gap: 3, padding: 10,
    minWidth: '22%',
  },
  codingVal: { ...Typography.h4, color: Colors.text0 },
  codingLbl: { ...Typography.bodyXs, color: Colors.text3, fontSize: 10 },

  // Tags
  tag: {
    backgroundColor: Colors.bg4, borderColor: Colors.border1,
    borderRadius: Radius.full, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  tagTxt: { ...Typography.bodyXs, color: Colors.text3, fontWeight: '600' },

  // Links
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  linkPlatform: { ...Typography.bodySm, color: Colors.text2, fontWeight: '600', minWidth: 70 },
  linkUrl: { ...Typography.bodySm, color: Colors.text3, flex: 1 },

  // Footer
  footer: { alignItems: 'center', paddingTop: 28, paddingBottom: 12 },
  footerTxt: { ...Typography.bodyXs, color: Colors.text4 },
});
