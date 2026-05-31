/**
 * app/(faculty-tabs)/announcements.tsx — Faculty Announcements
 *
 * Faculty can create announcements that are stored on the server and
 * visible to ALL students in the ecosystem (shared feed).
 *
 * Architecture:
 *  - On mount: loads MY announcements from GET /api/faculty/announcements
 *  - On post:  calls POST /api/faculty/announcements, prepends result
 *  - Fallback: if API is unreachable, stores locally (demo resilience)
 *  - SEED announcements shown only when the list is empty (first load)
 *
 * Demo Polish:
 *  - Rich category badges with colour-coded icons
 *  - "Shared" indicator so faculty sees the ecosystem connection
 *  - Real timestamps from server, relative display
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { announcementsAPI } from '@/lib/api';
import {
  Colors, Layout, NAV_BOTTOM_OFFSET, Radius,
  Shadow, Spacing, Surface, Typography,
} from '@/lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryKey = 'Academic' | 'Internship' | 'Event' | 'Hackathon' | 'Workshop' | 'General';

type CategoryMeta = {
  key:   CategoryKey;
  label: string;
  icon:  string;
  color: string;
  bg:    string;
};

type Announcement = {
  // Server fields
  _id?:         string;
  createdBy?:   { name: string } | string;
  createdAt?:   string;
  isPublished?: boolean;
  // UI fields (local or mapped from server)
  id:           string;
  title:        string;
  description:  string;
  category:     CategoryKey;
  authorName:   string;
  dateLabel:    string;
  isLocal?:     boolean; // true = not yet synced / API unreachable
};

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: CategoryMeta[] = [
  { key: 'Academic',    label: 'Academic',    icon: 'school-outline',     color: Colors.accent,   bg: Colors.accentDim },
  { key: 'Internship',  label: 'Internship',  icon: 'briefcase-outline',  color: Colors.success,  bg: Colors.status.successBg },
  { key: 'Event',       label: 'Event',       icon: 'calendar-outline',   color: Colors.warning,  bg: Colors.status.warningBg },
  { key: 'Hackathon',   label: 'Hackathon',   icon: 'trophy-outline',     color: Colors.accentLight, bg: Colors.accentDim },
  { key: 'Workshop',    label: 'Workshop',    icon: 'bulb-outline',       color: Colors.success,  bg: Colors.status.successBg },
  { key: 'General',     label: 'General',     icon: 'megaphone-outline',  color: Colors.text2,    bg: Colors.bg3 },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c])) as Record<CategoryKey, CategoryMeta>;

function getCat(key?: string): CategoryMeta {
  return CAT_MAP[(key as CategoryKey)] ?? CAT_MAP['General'];
}

// ─── Seed data (shown only when no server data + first load) ──────────────────

const SEED: Announcement[] = [
  {
    id: 'seed-1',
    title: 'CIE-II Examination Schedule — June 2025',
    description:
      'The second Continuous Internal Evaluation (CIE-II) examinations for all branches are scheduled from 16 June to 22 June 2025. Students are required to carry their hall tickets and college ID cards. Attendance below 75% may result in debarment.',
    category: 'Academic',
    authorName: 'Dr. R. Borthakur',
    dateLabel: '28 May 2025',
  },
  {
    id: 'seed-2',
    title: 'Smart India Hackathon 2025 — Registration Open',
    description:
      'Teams of 2–6 students are invited to register for SIH 2025. Submit your problem statement preference and team details to the T&P Cell by 5 June 2025. Faculty mentors will be assigned after shortlisting.',
    category: 'Hackathon',
    authorName: 'Prof. A. Hazarika',
    dateLabel: '25 May 2025',
  },
  {
    id: 'seed-3',
    title: 'Summer Internship — Tata Consultancy Services',
    description:
      'TCS is offering a 6-week Summer Internship for pre-final year students (CSE, ECE, IT). Stipend: ₹10,000/month. Eligible students (CGPA ≥ 7.0) must apply through the T&P portal before 1 June 2025.',
    category: 'Internship',
    authorName: 'Training & Placement Cell',
    dateLabel: '22 May 2025',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNow(): string {
  return new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function relativeDate(iso?: string): string {
  if (!iso) return formatNow();
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function serverToLocal(a: any): Announcement {
  const authorName =
    typeof a.createdBy === 'object' ? a.createdBy?.name ?? 'Faculty'
    : 'Faculty';
  return {
    _id:         a._id,
    createdAt:   a.createdAt,
    isPublished: a.isPublished,
    id:          a._id ?? `srv-${Date.now()}`,
    title:       a.title,
    description: a.description,
    category:    (a.category as CategoryKey) ?? 'General',
    authorName,
    dateLabel:   relativeDate(a.createdAt),
  };
}

// ─── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({
  item, onDelete,
}: {
  item: Announcement;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = getCat(item.category);

  return (
    <Pressable
      style={[S.card, item.isLocal && S.cardLocal]}
      onPress={() => setExpanded(v => !v)}
      android_ripple={{ color: Colors.border1 }}
    >
      {/* Top row */}
      <View style={S.cardTopRow}>
        <View style={[S.tag, { backgroundColor: cat.bg }]}>
          <Ionicons name={cat.icon as any} size={11} color={cat.color} />
          <Text style={[S.tagText, { color: cat.color }]}>{cat.label}</Text>
        </View>

        {/* Shared badge */}
        <View style={S.sharedBadge}>
          <Ionicons name="globe-outline" size={10} color={Colors.success} />
          <Text style={S.sharedText}>Shared</Text>
        </View>

        {item.isLocal && (
          <View style={S.localBadge}>
            <Ionicons name="cloud-offline-outline" size={10} color={Colors.warning} />
            <Text style={S.localBadgeText}>Local</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        {onDelete && (
          <Pressable onPress={onDelete} hitSlop={10} style={S.deleteBtn}>
            <Ionicons name="trash-outline" size={14} color={Colors.danger} />
          </Pressable>
        )}
      </View>

      {/* Title */}
      <Text style={S.cardTitle}>{item.title}</Text>

      {/* Description */}
      <Text style={S.cardBody} numberOfLines={expanded ? undefined : 3}>
        {item.description}
      </Text>

      <Text style={S.expandHint}>{expanded ? 'Show less ↑' : 'Read more ↓'}</Text>

      {/* Footer */}
      <View style={S.cardFooter}>
        <View style={S.authorRow}>
          <Ionicons name="person-circle-outline" size={13} color={Colors.text4} />
          <Text style={S.cardAuthor}>{item.authorName}</Text>
        </View>
        <Text style={S.cardDate}>{item.dateLabel}</Text>
      </View>
    </Pressable>
  );
}

// ─── Compose sheet ────────────────────────────────────────────────────────────

type ComposeSheetProps = {
  visible:  boolean;
  onClose:  () => void;
  onPost:   (data: { title: string; description: string; category: CategoryKey }) => Promise<void>;
};

function ComposeSheet({ visible, onClose, onPost }: ComposeSheetProps) {
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [category, setCategory] = useState<CategoryMeta>(CATEGORIES[0]);
  const [error,    setError]    = useState('');
  const [posting,  setPosting]  = useState(false);
  const descRef = useRef<TextInput>(null);

  function reset() {
    setTitle(''); setDesc(''); setCategory(CATEGORIES[0]); setError(''); setPosting(false);
  }

  function handleClose() {
    if (posting) return;
    reset();
    onClose();
  }

  async function handlePost() {
    const t = title.trim();
    const d = desc.trim();
    if (!t) { setError('Please enter a title.'); return; }
    if (!d) { setError('Please enter a description.'); return; }
    setError('');
    setPosting(true);
    try {
      await onPost({ title: t, description: d, category: category.key });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      onClose();
    } catch {
      setError('Could not post — saved locally.');
      setPosting(false);
    }
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
          <View style={S.sheetHandle} />

          {/* Header */}
          <View style={S.sheetHeader}>
            <View>
              <Text style={S.sheetTitle}>New Announcement</Text>
              <Text style={S.sheetSub}>Visible to all students</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12} style={S.sheetClose} disabled={posting}>
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
                  style={[
                    S.catChip,
                    active && { backgroundColor: cat.bg, borderColor: cat.color + '80' },
                  ]}
                >
                  <Ionicons name={cat.icon as any} size={12} color={active ? cat.color : Colors.text3} />
                  <Text style={[S.catChipTxt, active && { color: cat.color }]}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Title */}
          <Text style={S.sheetLabel}>TITLE</Text>
          <TextInput
            style={S.input}
            placeholder="Announcement title…"
            placeholderTextColor={Colors.text4}
            value={title}
            onChangeText={t => { setTitle(t); setError(''); }}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            maxLength={120}
            editable={!posting}
          />

          {/* Description */}
          <Text style={S.sheetLabel}>DESCRIPTION</Text>
          <TextInput
            ref={descRef}
            style={[S.input, S.inputMulti]}
            placeholder="Write the full announcement here…"
            placeholderTextColor={Colors.text4}
            value={desc}
            onChangeText={d => { setDesc(d); setError(''); }}
            multiline
            textAlignVertical="top"
            maxLength={1200}
            editable={!posting}
          />
          <Text style={S.charCount}>{desc.length} / 1200</Text>

          {!!error && <Text style={S.errorText}>{error}</Text>}

          <Pressable
            style={[S.postBtn, (posting || !title.trim() || !desc.trim()) && S.postBtnDisabled]}
            onPress={handlePost}
            disabled={posting || !title.trim() || !desc.trim()}
          >
            {posting
              ? <ActivityIndicator size="small" color={Colors.bg1} />
              : <Ionicons name="send-outline" size={16} color={Colors.bg1} />
            }
            <Text style={S.postBtnTxt}>{posting ? 'Posting…' : 'Post Announcement'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [composeOpen,   setComposeOpen]   = useState(false);
  const initialLoadDone = useRef(false);

  // ── Load from server ────────────────────────────────────────────────────

  const loadAnnouncements = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await announcementsAPI.getMine();
      const serverItems: Announcement[] = (res.data.data ?? []).map(serverToLocal);
      if (serverItems.length > 0) {
        setAnnouncements(serverItems);
      } else if (!initialLoadDone.current) {
        // First ever load with empty server — show seeds for demo
        setAnnouncements(SEED);
      }
    } catch {
      // API unreachable — preserve whatever is already in state, seed on first load
      if (!initialLoadDone.current) {
        setAnnouncements(SEED);
      }
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, []);

  useEffect(() => { loadAnnouncements(true); }, [loadAnnouncements]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnnouncements().finally(() => setRefreshing(false));
  }, [loadAnnouncements]);

  // ── Post handler ────────────────────────────────────────────────────────

  const handlePost = async (data: { title: string; description: string; category: CategoryKey }) => {
    // Optimistic local prepend first
    const optimistic: Announcement = {
      id:          `opt-${Date.now()}`,
      title:       data.title,
      description: data.description,
      category:    data.category,
      authorName:  'You (Faculty)',
      dateLabel:   'just now',
      isLocal:     true,
    };
    setAnnouncements(prev => [optimistic, ...prev.filter(a => !a.id.startsWith('seed-'))]);

    try {
      const res = await announcementsAPI.create(data);
      const saved = serverToLocal(res.data.data);
      // Replace optimistic with real server item
      setAnnouncements(prev =>
        prev.map(a => a.id === optimistic.id ? saved : a)
      );
    } catch {
      // Keep the optimistic item but mark it local
      // (error message is shown inside ComposeSheet)
      throw new Error('API error');
    }
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={['top']} style={S.root}>

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.title}>Announcements</Text>
          <Text style={S.subtitle}>Posted to all students</Text>
        </View>
        <View style={S.countBadge}>
          <Text style={S.countText}>{announcements.length}</Text>
        </View>
      </View>

      {/* Ecosystem notice */}
      <View style={S.notice}>
        <Ionicons name="globe-outline" size={13} color={Colors.success} />
        <Text style={S.noticeText}>
          Announcements are shared across the entire student ecosystem
        </Text>
      </View>

      {loading ? (
        <View style={S.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
        >
          {announcements.length === 0 ? (
            <View style={S.emptyWrap}>
              <Ionicons name="megaphone-outline" size={40} color={Colors.text4} />
              <Text style={S.emptyText}>No announcements yet</Text>
              <Text style={S.emptySub}>Tap + to post your first announcement</Text>
            </View>
          ) : (
            announcements.map(item => (
              <AnnouncementCard
                key={item.id}
                item={item}
                onDelete={
                  (item.isLocal || item.id.startsWith('opt-'))
                    ? () => handleDelete(item.id)
                    : undefined
                }
              />
            ))
          )}
          <View style={{ height: NAV_BOTTOM_OFFSET + 80 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        style={S.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setComposeOpen(true);
        }}
      >
        <Ionicons name="add" size={26} color={Colors.bg1} />
      </Pressable>

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
    paddingBottom: Spacing.xs,
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

  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.status.successBg,
    borderColor: Colors.status.successBorder, borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  noticeText: { ...Typography.bodyXs, color: Colors.success, flex: 1 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xs,
    gap: Spacing.md,
  },

  emptyWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: Spacing.sm,
  },
  emptyText: { ...Typography.h4, color: Colors.text3 },
  emptySub:  { ...Typography.bodySm, color: Colors.text4 },

  // Cards
  card: {
    ...Surface.card,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderRadius: Radius.lg,
  },
  cardLocal: {
    borderColor: Colors.warning + '55',
    backgroundColor: Colors.status.warningBg,
  },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.xs,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  tagText: { ...Typography.bodyXs, fontWeight: '600', fontSize: 10 },

  sharedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.status.successBg,
    borderColor: Colors.status.successBorder, borderWidth: 1,
    borderRadius: Radius.xs,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  sharedText: { ...Typography.bodyXs, color: Colors.success, fontWeight: '600', fontSize: 9 },

  localBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.status.warningBg,
    borderRadius: Radius.xs,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  localBadgeText: { ...Typography.bodyXs, color: Colors.warning, fontWeight: '600', fontSize: 9 },

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
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
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
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: { ...Typography.h3, color: Colors.text0 },
  sheetSub:   { ...Typography.bodyXs, color: Colors.success, marginTop: 2 },
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
  inputMulti: { minHeight: 100, maxHeight: 160 },
  charCount:  { ...Typography.bodyXs, color: Colors.text4, alignSelf: 'flex-end', marginTop: -6 },
  errorText:  { ...Typography.bodyXs, color: Colors.danger, marginTop: -4 },

  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 13,
    marginTop: 4,
  },
  postBtnDisabled: { opacity: 0.45 },
  postBtnTxt: { ...Typography.h4, color: Colors.bg1, fontWeight: '700' },
});
