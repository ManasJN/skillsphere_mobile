/**
 * app/(faculty-tabs)/announcements.tsx — Announcements
 *
 * Phase 1: Lists existing announcements. Shows a "Coming soon" empty
 *          state with a compose FAB that is visually present but shows
 *          a "Phase 2" tooltip — keeps the demo impressive without
 *          broken flows.
 *
 * Phase 2: Wire the FAB to a compose sheet + facultyAPI.createAnnouncement.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { facultyAPI, type Announcement } from '@/lib/faculty';
import {
  Colors, Layout, NAV_BOTTOM_OFFSET, Radius,
  Shadow, Spacing, Surface, Typography,
} from '@/lib/theme';

// ─── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: Announcement }) {
  const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={[S.card, item.pinned && S.cardPinned]}>
      {item.pinned && (
        <View style={S.pinnedRow}>
          <Ionicons name="pin" size={12} color={Colors.warning} />
          <Text style={S.pinnedText}>Pinned</Text>
        </View>
      )}
      <Text style={S.cardTitle}>{item.title}</Text>
      <Text style={S.cardBody} numberOfLines={4}>{item.body}</Text>
      <View style={S.cardFooter}>
        <Text style={S.cardAuthor}>{item.author?.name ?? 'Faculty'}</Text>
        <Text style={S.cardDate}>{date}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnnouncementsScreen() {
  const [items, setItems]       = useState<Announcement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState('');
  const [composeTip, setComposeTip] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await facultyAPI.getAnnouncements();
      setItems(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      // 404 just means no announcements yet — not an error worth showing
      if (e?.response?.status !== 404) {
        setError(e?.response?.data?.message ?? 'Could not load announcements.');
      }
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = useCallback(({ item }: { item: Announcement }) => (
    <AnnouncementCard item={item} />
  ), []);

  return (
    <SafeAreaView edges={['top']} style={S.root}>

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.title}>Announcements</Text>
          <Text style={S.subtitle}>Broadcast to your students</Text>
        </View>
      </View>

      {error ? (
        <View style={S.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={S.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={[
          S.list,
          { paddingBottom: NAV_BOTTOM_OFFSET + 80 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent} />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={S.empty}>
              <View style={S.emptyIcon}>
                <Ionicons name="megaphone-outline" size={32} color={Colors.accent} />
              </View>
              <Text style={S.emptyTitle}>No announcements yet</Text>
              <Text style={S.emptyBody}>
                Tap the compose button below to post your first announcement to students.
              </Text>
            </View>
          )
        }
      />

      {/* Compose FAB — Phase 2 placeholder */}
      {composeTip && (
        <View style={S.tip}>
          <Text style={S.tipText}>Announcement posting coming in Phase 2 🚀</Text>
        </View>
      )}

      <Pressable
        style={S.fab}
        onPress={() => {
          setComposeTip(v => !v);
          // Phase 2: open compose sheet
        }}>
        <Ionicons name="add" size={26} color={Colors.bg1} />
      </Pressable>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.bg1 },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title:    { ...Typography.h2, color: Colors.text0 },
  subtitle: { ...Typography.bodySm, color: Colors.text3, marginTop: 2 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.status.dangerBg,
    borderColor: Colors.status.dangerBorder, borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.sm,
  },
  errorText: { ...Typography.bodySm, color: Colors.danger, flex: 1 },

  list: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.xs, gap: Spacing.sm },

  card: {
    ...Surface.card,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardPinned: {
    borderColor: Colors.warning + '55',
    backgroundColor: Colors.status.warningBg,
  },
  pinnedRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinnedText: { ...Typography.bodyXs, color: Colors.warning, fontWeight: '600' },
  cardTitle:  { ...Typography.h4, color: Colors.text0 },
  cardBody:   { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  cardAuthor: { ...Typography.bodyXs, color: Colors.accent },
  cardDate:   { ...Typography.bodyXs, color: Colors.text4 },

  empty: {
    alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xxl, gap: Spacing.md,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: Radius.xl,
    backgroundColor: Colors.accentDim, borderColor: Colors.accentMid, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { ...Typography.h4, color: Colors.text2 },
  emptyBody:  { ...Typography.bodySm, color: Colors.text4, textAlign: 'center' },

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
