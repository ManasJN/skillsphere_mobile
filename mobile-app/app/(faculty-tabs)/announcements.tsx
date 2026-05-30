/**
 * app/(faculty-tabs)/announcements.tsx — Announcements
 *
 * Demo: Shows 3 realistic static announcement cards for demo/APK presentation.
 * Phase 2: Wire FAB to compose sheet + facultyAPI.createAnnouncement.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, Layout, NAV_BOTTOM_OFFSET, Radius,
  Shadow, Spacing, Surface, Typography,
} from '@/lib/theme';

// ─── Static demo announcements ────────────────────────────────────────────────

type DemoAnnouncement = {
  id: string;
  title: string;
  body: string;
  author: string;
  date: string;
  pinned?: boolean;
  tag: string;
  tagColor: string;
  tagBg: string;
  icon: string;
};

const DEMO_ANNOUNCEMENTS: DemoAnnouncement[] = [
  {
    id: '1',
    title: 'CIE-II Examination Schedule — June 2025',
    body: 'The second Continuous Internal Evaluation (CIE-II) examinations for all branches are scheduled from 16 June to 22 June 2025. Students are required to carry their hall tickets and college ID cards. Any requests for re-scheduling must be submitted to the academic office by 10 June. Attendance below 75% may result in debarment from appearing in the examination.',
    author: 'Dr. R. Borthakur',
    date: '28 May 2025',
    pinned: true,
    tag: 'Exam',
    tagColor: Colors.danger,
    tagBg: Colors.status.dangerBg,
    icon: 'document-text-outline',
  },
  {
    id: '2',
    title: 'Smart India Hackathon 2025 — Registration Open',
    body: 'Teams of 2–6 students from any branch are invited to register for SIH 2025 (Software Edition). This is an excellent opportunity to build industry-relevant solutions and gain national recognition. Interested teams must submit their problem statement preference and team details to the Training & Placement Cell by 5 June 2025. Faculty mentors will be assigned after shortlisting.',
    author: 'Prof. A. Hazarika',
    date: '25 May 2025',
    pinned: false,
    tag: 'Hackathon',
    tagColor: Colors.accent,
    tagBg: Colors.accentDim,
    icon: 'trophy-outline',
  },
  {
    id: '3',
    title: 'Summer Internship Opportunity — Tata Consultancy Services',
    body: 'TCS is offering a 6-week Summer Internship Programme for pre-final year students (CSE, ECE, IT). The internship will be conducted in hybrid mode from 10 June to 20 July 2025. Stipend: ₹10,000/month. Eligible students (CGPA ≥ 7.0) must apply through the T&P portal before 1 June 2025. Selected students will be notified via email by 7 June.',
    author: 'Training & Placement Cell',
    date: '22 May 2025',
    pinned: false,
    tag: 'Internship',
    tagColor: Colors.success,
    tagBg: Colors.status.successBg,
    icon: 'briefcase-outline',
  },
];

// ─── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: DemoAnnouncement }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={[S.card, item.pinned && S.cardPinned]}
      onPress={() => setExpanded(v => !v)}
      android_ripple={{ color: Colors.border1 }}
    >
      {/* Top row: tag + pinned marker */}
      <View style={S.cardTopRow}>
        <View style={[S.tag, { backgroundColor: item.tagBg }]}>
          <Ionicons name={item.icon as any} size={11} color={item.tagColor} />
          <Text style={[S.tagText, { color: item.tagColor }]}>{item.tag}</Text>
        </View>
        {item.pinned && (
          <View style={S.pinnedBadge}>
            <Ionicons name="pin" size={11} color={Colors.warning} />
            <Text style={S.pinnedText}>Pinned</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={S.cardTitle}>{item.title}</Text>

      {/* Body — collapses to 3 lines */}
      <Text
        style={S.cardBody}
        numberOfLines={expanded ? undefined : 3}
      >
        {item.body}
      </Text>

      {/* Expand hint */}
      <Text style={S.expandHint}>{expanded ? 'Show less ↑' : 'Read more ↓'}</Text>

      {/* Footer */}
      <View style={S.cardFooter}>
        <View style={S.authorRow}>
          <Ionicons name="person-circle-outline" size={13} color={Colors.text4} />
          <Text style={S.cardAuthor}>{item.author}</Text>
        </View>
        <Text style={S.cardDate}>{item.date}</Text>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnnouncementsScreen() {
  const [composeTip, setComposeTip] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={S.root}>

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.title}>Announcements</Text>
          <Text style={S.subtitle}>Broadcast to your students</Text>
        </View>
        <View style={S.countBadge}>
          <Text style={S.countText}>{DEMO_ANNOUNCEMENTS.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={S.list}
        showsVerticalScrollIndicator={false}
      >
        {DEMO_ANNOUNCEMENTS.map(item => (
          <AnnouncementCard key={item.id} item={item} />
        ))}
        <View style={{ height: NAV_BOTTOM_OFFSET + 80 }} />
      </ScrollView>

      {/* Compose FAB — Phase 2 placeholder */}
      {composeTip && (
        <View style={S.tip}>
          <Text style={S.tipText}>Announcement posting coming in Phase 2 🚀</Text>
        </View>
      )}

      <Pressable
        style={S.fab}
        onPress={() => setComposeTip(v => !v)}
      >
        <Ionicons name="add" size={26} color={Colors.bg1} />
      </Pressable>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title:    { ...Typography.h2, color: Colors.text0 },
  subtitle: { ...Typography.bodySm, color: Colors.text3, marginTop: 2 },
  countBadge: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid, borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  countText: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '700' },

  list: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xs,
    gap: Spacing.md,
  },

  card: {
    ...Surface.card,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderRadius: Radius.lg,
  },
  cardPinned: {
    borderColor: Colors.warning + '44',
    backgroundColor: Colors.status.warningBg,
  },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.xs,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  tagText: { ...Typography.bodyXs, fontWeight: '600', fontSize: 10 },

  pinnedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.status.warningBg,
    borderRadius: Radius.xs,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  pinnedText: { ...Typography.bodyXs, color: Colors.warning, fontWeight: '600' },

  cardTitle: { ...Typography.h4, color: Colors.text0, lineHeight: 22 },
  cardBody:  { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },

  expandHint: {
    ...Typography.bodyXs,
    color: Colors.accent,
    marginTop: -Spacing.xxs,
  },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border0,
  },
  authorRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardAuthor: { ...Typography.bodyXs, color: Colors.accent },
  cardDate:   { ...Typography.bodyXs, color: Colors.text4 },

  fab: {
    position: 'absolute',
    bottom: NAV_BOTTOM_OFFSET + Spacing.lg,
    right: Layout.screenPadding,
    width: 52, height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.hairline,
  },

  tip: {
    position: 'absolute',
    bottom: NAV_BOTTOM_OFFSET + 80,
    right: Layout.screenPadding,
    backgroundColor: Colors.bg4,
    borderColor: Colors.border2, borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    maxWidth: 240,
  },
  tipText: { ...Typography.bodySm, color: Colors.text1 },
});
