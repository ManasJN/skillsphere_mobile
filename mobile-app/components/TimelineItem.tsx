/**
 * components/TimelineItem.tsx
 *
 * A single entry in the achievement timeline.
 *
 * Visual structure:
 *
 *   ┌─ dot ──┐
 *   │   ●    │  Title                         Mar 2024
 *   │   │    │  Organisation (if present)
 *   │   │    │  ▼ (expand indicator)
 *   │   │    │
 *   │   │    │  [expanded]
 *   │   │    │  Description text
 *   │   │    │  tag  tag  tag
 *   └───┘────┘
 *
 * The left column is the timeline rail:
 *  - A coloured dot marks the entry
 *  - A vertical line connects entries (hidden on the last item)
 *
 * Expand/collapse:
 *  - Only shown when description or tags are present
 *  - Uses a height animation (maxHeight interpolation) — smooth, no jarring jumps
 *  - Press the whole row to toggle; chevron gives visual affordance
 *
 * Press feedback:
 *  - usePressScale(0.985) — very subtle, not distracting
 *
 * Performance:
 *  - Animated.Value refs never re-created (useRef)
 *  - No inline function declarations in render that cause re-renders
 *  - isLast prop controls connector visibility, not a list-level calculation
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Duration, Ease, usePressScale } from '@/hooks/useAnimations';
import {
  CATEGORY_CONFIG,
  formatTimelineDate,
  type TimelineEntry,
} from '@/lib/timeline';
import { Colors, Radius, Typography } from '@/lib/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  entry:   TimelineEntry;
  isLast:  boolean;
  onEdit:  (entry: TimelineEntry) => void;
  onDelete:(entry: TimelineEntry) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TimelineItem({ entry, isLast, onEdit, onDelete }: Props) {
  const cfg     = CATEGORY_CONFIG[entry.category];
  const hasBody = !!(entry.description || (entry.tags && entry.tags.length > 0));

  const [expanded,    setExpanded]    = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Expand animation — maxHeight interpolation
  const expandAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const { scale, onPressIn, onPressOut } = usePressScale(0.985);

  const toggle = useCallback(() => {
    if (!hasBody || isAnimating.current) return;
    isAnimating.current = true;
    setShowActions(false);

    const toValue = expanded ? 0 : 1;
    Animated.timing(expandAnim, {
      toValue,
      duration: Duration.standard,
      easing: Ease.decel,
      useNativeDriver: false, // maxHeight can't use native driver
    }).start(() => {
      isAnimating.current = false;
    });
    setExpanded(!expanded);
  }, [expanded, hasBody, expandAnim]);

  const handleLongPress = useCallback(() => {
    setShowActions(v => !v);
  }, []);

  // maxHeight: 0 → collapsed, 300 → expanded (generous ceiling)
  const bodyMaxHeight = expandAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 300],
  });
  const bodyOpacity = expandAnim.interpolate({
    inputRange:  [0, 0.4, 1],
    outputRange: [0, 0,   1],
  });

  // Chevron rotation: 0° → 90°
  const chevronRotate = expandAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={S.root}>
      {/* ── Left rail ── */}
      <View style={S.rail}>
        {/* Category dot */}
        <View style={[S.dot, { backgroundColor: cfg.color }]}>
          <Ionicons name={cfg.icon as any} size={10} color={Colors.bg1} />
        </View>
        {/* Connecting line — hidden on last item */}
        {!isLast && <View style={S.line} />}
      </View>

      {/* ── Content ── */}
      <View style={S.content}>
        <Pressable
          onPress={toggle}
          onLongPress={handleLongPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={!hasBody && !true /* always pressable for long-press */}
        >
          <Animated.View style={[S.header, { transform: [{ scale }] }]}>
            {/* Title row */}
            <View style={S.titleRow}>
              <View style={S.titleGroup}>
                <Text style={S.title} numberOfLines={2}>{entry.title}</Text>
                {entry.organisation ? (
                  <Text style={S.org} numberOfLines={1}>{entry.organisation}</Text>
                ) : null}
              </View>
              <View style={S.rightCol}>
                <Text style={S.date}>{formatTimelineDate(entry.date, entry.endDate)}</Text>
                {hasBody && (
                  <Animated.View style={[S.chevron, { transform: [{ rotate: chevronRotate }] }]}>
                    <Ionicons name="chevron-forward" size={12} color={Colors.text4} />
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Category label */}
            <View style={[S.categoryChip, { borderColor: cfg.color + '40' }]}>
              <Text style={[S.categoryTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </Animated.View>
        </Pressable>

        {/* ── Expanded body ── */}
        {hasBody && (
          <Animated.View style={[S.body, { maxHeight: bodyMaxHeight, opacity: bodyOpacity }]}>
            <View style={S.bodyInner}>
              {entry.description ? (
                <Text style={S.description}>{entry.description}</Text>
              ) : null}
              {entry.tags && entry.tags.length > 0 ? (
                <View style={S.tags}>
                  {entry.tags.map(tag => (
                    <View key={tag} style={S.tag}>
                      <Text style={S.tagTxt}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </Animated.View>
        )}

        {/* ── Long-press action row ── */}
        {showActions && (
          <View style={S.actions}>
            <Pressable
              onPress={() => { setShowActions(false); onEdit(entry); }}
              style={S.actionBtn}
              hitSlop={8}>
              <Ionicons name="create-outline" size={13} color={Colors.text2} />
              <Text style={S.actionTxt}>Edit</Text>
            </Pressable>
            <View style={S.actionDivider} />
            <Pressable
              onPress={() => { setShowActions(false); onDelete(entry); }}
              style={S.actionBtn}
              hitSlop={8}>
              <Ionicons name="trash-outline" size={13} color={Colors.danger} />
              <Text style={[S.actionTxt, { color: Colors.danger }]}>Delete</Text>
            </Pressable>
          </View>
        )}

        {/* Spacing below content, before next item */}
        {!isLast && <View style={S.gap} />}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DOT_SIZE  = 20;
const LINE_W    = 1;

const S = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: 12,
  },

  // ── Rail ──
  rail: {
    alignItems: 'center',
    width: DOT_SIZE,
    // Rail must stretch the full height of the content
    // We use flex on line to fill remaining space
  },
  dot: {
    width:        DOT_SIZE,
    height:       DOT_SIZE,
    borderRadius: Radius.full,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  line: {
    flex: 1,
    width: LINE_W,
    backgroundColor: Colors.border1,
    marginTop: 4,
    marginBottom: 0,
    minHeight: 16,
  },

  // ── Content ──
  content: {
    flex: 1,
    paddingTop: 1,    // align top of title with dot center
    paddingBottom: 0,
  },

  // ── Header (pressable area) ──
  header: {
    gap: 6,
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            8,
  },
  titleGroup: {
    flex:  1,
    gap:   2,
  },
  title: {
    ...Typography.h4,
    color:    Colors.text0,
    flexWrap: 'wrap',
  },
  org: {
    ...Typography.bodyXs,
    color:      Colors.text3,
    fontStyle:  'italic',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap:        4,
    flexShrink: 0,
  },
  date: {
    ...Typography.bodyXs,
    color:       Colors.text3,
    textAlign:   'right',
  },
  chevron: {
    // Positioned inside rightCol, below date
  },

  // Category chip
  categoryChip: {
    alignSelf:      'flex-start',
    borderRadius:   Radius.xs,
    borderWidth:    1,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  categoryTxt: {
    ...Typography.bodyXs,
    fontWeight: '500',
  },

  // ── Expanded body ──
  body: {
    overflow: 'hidden',
  },
  bodyInner: {
    gap:       8,
    paddingTop: 8,
  },
  description: {
    ...Typography.bodySm,
    color:      Colors.text2,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
  tag: {
    backgroundColor:  Colors.bg3,
    borderColor:      Colors.border1,
    borderRadius:     Radius.xs,
    borderWidth:      1,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  tagTxt: {
    ...Typography.bodyXs,
    color:      Colors.text2,
    fontWeight: '500',
  },

  // ── Actions (long-press) ──
  actions: {
    alignItems:     'center',
    backgroundColor: Colors.bg3,
    borderColor:    Colors.border1,
    borderRadius:   Radius.sm,
    borderWidth:    1,
    flexDirection:  'row',
    marginTop:      8,
    overflow:       'hidden',
  },
  actionBtn: {
    alignItems:    'center',
    flexDirection: 'row',
    flex:          1,
    gap:           5,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionTxt: {
    ...Typography.bodyXs,
    color:      Colors.text2,
    fontWeight: '500',
  },
  actionDivider: {
    backgroundColor: Colors.border1,
    height:          '100%',
    width:           1,
  },

  // Space between entries (replaces marginBottom to stay outside rail flex)
  gap: {
    height: 20,
  },
});
