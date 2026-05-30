/**
 * app/(faculty-tabs)/announcements.tsx — Announcements
 *
 * Demo Polish: Faculty can now actually create announcements.
 *
 * Implementation:
 *  - Compose sheet (Modal) with title, body, category picker
 *  - New announcements prepended to the list in local state
 *  - Preserves the three realistic seeded announcements from before
 *  - Minimalist dark UI, no network calls — lightweight local state only
 *  - Suitable for live professor demo and APK showcase
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, Layout, NAV_BOTTOM_OFFSET, Radius,
  Shadow, Spacing, Surface, Typography,
} from '@/lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnnouncementCategory = {
  key:   string;
  label: string;
  icon:  string;
  color: string;
  bg:    string;
};

type Announcement = {
  id:       string;
  title:    string;
  body:     string;
  author:   string;
  date:     string;
  pinned?:  boolean;
  category: AnnouncementCategory;
};

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORIES: AnnouncementCategory[] = [
  {
    key: 'general', label: 'General',
    icon: 'megaphone-outline',
    color: Colors.accent, bg: Colors.accentDim,
  },
  {
    key: 'exam', label: 'Exam',
    icon: 'document-text-outline',
    color: Colors.danger, bg: Colors.status.dangerBg,
  },
  {
    key: 'hackathon', label: 'Hackathon',
    icon: 'trophy-outline',
    color: Colors.accent, bg: Colors.accentDim,
  },
  {
    key: 'internship', label: 'Internship',
    icon: 'briefcase-outline',
    color: Colors.success, bg: Colors.status.successBg,
  },
  {
    key: 'deadline', label: 'Deadline',
    icon: 'alarm-outline',
    color: Colors.warning, bg: Colors.status.warningBg,
  },
  {
    key: 'workshop', label: 'Workshop',
    icon: 'bulb-outline',
    color: Colors.success, bg: Colors.status.successBg,
  },
];

// ─── Seed announcements ───────────────────────────────────────────────────────

const SEED: Announcement[] = [
  {
    id: 'seed-1',
    title: 'CIE-II Examination Schedule — June 2025',
    body: 'The second Continuous Internal Evaluation (CIE-II) examinations for all branches are scheduled from 16 June to 22 June 2025. Students are required to carry their hall tickets and college ID cards. Any requests for re-scheduling must be submitted to the academic office by 10 June. Attendance below 75% may result in debarment from appearing in the examination.',
    author: 'Dr. R. Borthakur',
    date: '28 May 2025',
    pinned: true,
    category: CATEGORIES[1], // Exam
  },
  {
    id: 'seed-2',
    title: 'Smart India Hackathon 2025 — Registration Open',
    body: 'Teams of 2–6 students from any branch are invited to register for SIH 2025 (Software Edition). This is an excellent opportunity to build industry-relevant solutions and gain national recognition. Interested teams must submit their problem statement preference and team details to the Training & Placement Cell by 5 June 2025. Faculty mentors will be assigned after shortlisting.',
    author: 'Prof. A. Hazarika',
    date: '25 May 2025',
    category: CATEGORIES[2], // Hackathon
  },
  {
    id: 'seed-3',
    title: 'Summer Internship Opportunity — Tata Consultancy Services',
    body: 'TCS is offering a 6-week Summer Internship Programme for pre-final year students (CSE, ECE, IT). The internship will be conducted in hybrid mode from 10 June to 20 July 2025. Stipend: ₹10,000/month. Eligible students (CGPA ≥ 7.0) must apply through the T&P portal before 1 June 2025. Selected students will be notified via email by 7 June.',
    author: 'Training & Placement Cell',
    date: '22 May 2025',
    category: CATEGORIES[3], // Internship
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNow(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({ item, onDelete }: { item: Announcement; onDelete?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isNew = item.id.startsWith('new-');

  return (
    <Pressable
      style={[S.card, item.pinned && S.cardPinned, isNew && S.cardNew]}
      onPress={() => setExpanded(v => !v)}
      android_ripple={{ color: Colors.border1 }}
    >
      {/* Top row: tag + pinned + delete (for newly posted) */}
      <View style={S.cardTopRow}>
        <View style={[S.tag, { backgroundColor: item.category.bg }]}>
          <Ionicons name={item.category.icon as any} size={11} color={item.category.color} />
          <Text style={[S.tagText, { color: item.category.color }]}>{item.category.label}</Text>
        </View>
        {item.pinned && (
          <View style={S.pinnedBadge}>
            <Ionicons name="pin" size={11} color={Colors.warning} />
            <Text style={S.pinnedText}>Pinned</Text>
          </View>
        )}
        {isNew && (
          <View style={S.newBadge}>
            <Text style={S.newBadgeText}>NEW</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {isNew && onDelete && (
          <Pressable onPress={onDelete} hitSlop={10} style={S.deleteBtn}>
            <Ionicons name="trash-outline" size={14} color={Colors.danger} />
          </Pressable>
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

// ─── Compose sheet ────────────────────────────────────────────────────────────

type ComposeSheetProps = {
  visible:  boolean;
  onClose:  () => void;
  onPost:   (a: Omit<Announcement, 'id'>) => void;
};

function ComposeSheet({ visible, onClose, onPost }: ComposeSheetProps) {
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>(CATEGORIES[0]);
  const [error,    setError]    = useState('');
  const bodyRef = useRef<TextInput>(null);

  function reset() {
    setTitle(''); setBody(''); setCategory(CATEGORIES[0]); setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handlePost() {
    const t = title.trim();
    const b = body.trim();
    if (!t) { setError('Please enter a title.'); return; }
    if (!b) { setError('Please enter a message body.'); return; }
    setError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPost({
      title: t,
      body: b,
      category,
      author: 'You (Faculty)',
      date: formatNow(),
    });
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={S.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={S.sheetWrap}
      >
        <View style={S.sheet}>
          {/* Handle */}
          <View style={S.sheetHandle} />

          {/* Header */}
          <View style={S.sheetHeader}>
            <Text style={S.sheetTitle}>New Announcement</Text>
            <Pressable onPress={handleClose} hitSlop={12} style={S.sheetClose}>
              <Ionicons name="close" size={20} color={Colors.text2} />
            </Pressable>
          </View>

          {/* Category picker */}
          <Text style={S.sheetLabel}>CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={S.catScroll}
            contentContainerStyle={S.catRow}
          >
            {CATEGORIES.map(cat => {
              const active = cat.key === category.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setCategory(cat)}
                  style={[S.catChip, active && { backgroundColor: cat.bg, borderColor: cat.color + '80' }]}
                >
                  <Ionicons name={cat.icon as any} size={12} color={active ? cat.color : Colors.text3} />
                  <Text style={[S.catChipTxt, active && { color: cat.color }]}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Title input */}
          <Text style={S.sheetLabel}>TITLE</Text>
          <TextInput
            style={S.input}
            placeholder="Announcement title…"
            placeholderTextColor={Colors.text4}
            value={title}
            onChangeText={t => { setTitle(t); setError(''); }}
            returnKeyType="next"
            onSubmitEditing={() => bodyRef.current?.focus()}
            maxLength={120}
          />

          {/* Body input */}
          <Text style={S.sheetLabel}>MESSAGE</Text>
          <TextInput
            ref={bodyRef}
            style={[S.input, S.inputMulti]}
            placeholder="Write the full announcement here…"
            placeholderTextColor={Colors.text4}
            value={body}
            onChangeText={b => { setBody(b); setError(''); }}
            multiline
            textAlignVertical="top"
            maxLength={1200}
          />

          {/* Char count */}
          <Text style={S.charCount}>{body.length} / 1200</Text>

          {/* Error */}
          {!!error && <Text style={S.errorText}>{error}</Text>}

          {/* Post button */}
          <Pressable
            style={[S.postBtn, (!title.trim() || !body.trim()) && S.postBtnDisabled]}
            onPress={handlePost}
          >
            <Ionicons name="send-outline" size={16} color={Colors.bg1} />
            <Text style={S.postBtnTxt}>Post Announcement</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(SEED);
  const [composeOpen,   setComposeOpen]   = useState(false);

  function handlePost(data: Omit<Announcement, 'id'>) {
    const next: Announcement = { ...data, id: `new-${Date.now()}` };
    setAnnouncements(prev => [next, ...prev]);
  }

  function handleDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  return (
    <SafeAreaView edges={['top']} style={S.root}>

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.title}>Announcements</Text>
          <Text style={S.subtitle}>Broadcast to your students</Text>
        </View>
        <View style={S.countBadge}>
          <Text style={S.countText}>{announcements.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={S.list}
        showsVerticalScrollIndicator={false}
      >
        {announcements.map(item => (
          <AnnouncementCard
            key={item.id}
            item={item}
            onDelete={item.id.startsWith('new-') ? () => handleDelete(item.id) : undefined}
          />
        ))}
        <View style={{ height: NAV_BOTTOM_OFFSET + 80 }} />
      </ScrollView>

      {/* Compose FAB */}
      <Pressable
        style={S.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setComposeOpen(true);
        }}
      >
        <Ionicons name="add" size={26} color={Colors.bg1} />
      </Pressable>

      {/* Compose sheet */}
      <ComposeSheet
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPost={handlePost}
      />

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

  // Cards
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
  cardNew: {
    borderColor: Colors.accentMid,
    backgroundColor: Colors.accentSoft,
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

  newBadge: {
    backgroundColor: Colors.accentMid,
    borderRadius: Radius.xs,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  newBadgeText: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '700', fontSize: 9 },

  deleteBtn: { padding: 4 },

  cardTitle: { ...Typography.h4, color: Colors.text0, lineHeight: 22 },
  cardBody:  { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  expandHint: { ...Typography.bodyXs, color: Colors.accent, marginTop: -Spacing.xxs },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.xs, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border0,
  },
  authorRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardAuthor: { ...Typography.bodyXs, color: Colors.accent },
  cardDate:   { ...Typography.bodyXs, color: Colors.text4 },

  // FAB
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

  // Compose modal
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.overlay,
  },
  sheetWrap: {
    flex: 1, justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: Colors.border1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    gap: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: { ...Typography.h3, color: Colors.text0 },
  sheetClose: {
    padding: 6,
    backgroundColor: Colors.bg4,
    borderRadius: Radius.full,
  },
  sheetLabel: {
    ...Typography.label,
    color: Colors.text4,
    letterSpacing: 0.5,
    marginBottom: -4,
  },

  catScroll: { marginHorizontal: -Spacing.xl },
  catRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1, borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  catChipTxt: { ...Typography.bodyXs, color: Colors.text3, fontWeight: '600' },

  input: {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1, borderWidth: 1,
    borderRadius: Radius.md,
    color: Colors.text0,
    fontSize: 14,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  inputMulti: {
    minHeight: 100,
    maxHeight: 160,
  },
  charCount: {
    ...Typography.bodyXs, color: Colors.text4,
    alignSelf: 'flex-end', marginTop: -6,
  },
  errorText: {
    ...Typography.bodyXs, color: Colors.danger,
    marginTop: -4,
  },

  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 13,
    marginTop: 4,
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnTxt: {
    ...Typography.h4, color: Colors.bg1, fontWeight: '700',
  },
});
