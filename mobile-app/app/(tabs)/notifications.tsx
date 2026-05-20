import { useCallback, useEffect, useState } from 'react';
import {
  Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { notificationsAPI } from '@/lib/api';
import { Colors, Radius, Shadow, Typography } from '@/lib/theme';
import { Badge, BadgeColor, Card, EmptyState, ErrorBanner, Row, Skeleton } from '@/components/ui';

type Notification = {
  _id: string; title: string; message: string;
  isRead: boolean; createdAt: string; type?: string;
};

function typeColor(t?: string): BadgeColor {
  return ({
    achievement: 'teal', goal: 'indigo', system: 'muted',
    event: 'amber', mentor: 'blue', opportunity: 'green',
  } as const)[t ?? ''] ?? 'muted';
}

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen() {
  const [items,      setItems]      = useState<Notification[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [marking,    setMarking]    = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await notificationsAPI.getMine();
      setItems(res.data.data ?? res.data ?? []);
    } catch { setError('Could not load notifications.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const unread = items.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    setMarking(true);
    try {
      await notificationsAPI.markAllRead();
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
    finally { setMarking(false); }
  };

  const markOne = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  // Group into today / earlier
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayItems   = items.filter(n => new Date(n.createdAt) >= today);
  const earlierItems = items.filter(n => new Date(n.createdAt) < today);

  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <ScrollView
        contentContainerStyle={S.content}
        refreshControl={<RefreshControl colors={[Colors.accent]} onRefresh={onRefresh} refreshing={refreshing} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Row style={S.header}>
          <View style={{ flex: 1 }}>
            <Text style={S.eyebrow}>Activity</Text>
            <Text style={S.title}>Notifications</Text>
          </View>
          {unread > 0 && (
            <Pressable
              disabled={marking}
              onPress={markAllRead}
              style={S.markAllBtn}
              hitSlop={10}>
              <Text style={S.markAllTxt}>{marking ? 'Clearing…' : 'Mark all read'}</Text>
            </Pressable>
          )}
        </Row>

        {/* ── Unread banner ── */}
        {unread > 0 && !loading && (
          <View style={S.unreadBanner}>
            <View style={S.unreadDot} />
            <Text style={S.unreadTxt}>
              {unread} unread notification{unread !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {error ? <ErrorBanner message={error} /> : null}

        {loading ? (
          <NotifSkeleton />
        ) : items.length === 0 ? (
          <Card>
            <EmptyState emoji="🔔" title="All caught up" body="Goal updates, achievements, and announcements will appear here." />
          </Card>
        ) : (
          <>
            {todayItems.length > 0 && (
              <NotifGroup title="Today" items={todayItems} onMarkRead={markOne} />
            )}
            {earlierItems.length > 0 && (
              <NotifGroup title="Earlier" items={earlierItems} onMarkRead={markOne} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotifGroup({ title, items, onMarkRead }: {
  title: string; items: Notification[]; onMarkRead: (id: string) => void;
}) {
  return (
    <View style={G.wrap}>
      <Text style={G.groupTitle}>{title}</Text>
      <View style={G.listCard}>
        {items.map((n, i) => (
          <View key={n._id}>
            {i > 0 && <View style={G.divider} />}
            <NotifRow notif={n} onMarkRead={onMarkRead} />
          </View>
        ))}
      </View>
    </View>
  );
}
const G = StyleSheet.create({
  wrap: { gap: 10 },
  groupTitle: { ...Typography.label, color: Colors.text3, paddingHorizontal: 2 },
  listCard: { backgroundColor: Colors.bg2, borderColor: Colors.border1, borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  divider: { backgroundColor: Colors.border0, height: 1 },
});

function NotifRow({ notif, onMarkRead }: { notif: Notification; onMarkRead: (id: string) => void }) {
  return (
    <Pressable
      onPress={() => { if (!notif.isRead) onMarkRead(notif._id); }}
      style={({ pressed }) => [nS.row, !notif.isRead && nS.rowUnread, pressed && nS.rowPressed]}>
      {!notif.isRead && <View style={nS.dot} />}
      <View style={nS.body}>
        <Row style={nS.top}>
          <Text style={[nS.title, !notif.isRead && nS.titleUnread]} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={nS.time}>{relativeTime(notif.createdAt)}</Text>
        </Row>
        <Text style={nS.msg} numberOfLines={3}>{notif.message}</Text>
        {notif.type && <Badge label={notif.type} color={typeColor(notif.type)} style={{ marginTop: 2 }} />}
      </View>
    </Pressable>
  );
}
const nS = StyleSheet.create({
  row: { flexDirection: 'row', gap: 0, padding: 16, paddingLeft: 20 },
  rowUnread: { backgroundColor: '#090D16' },
  rowPressed: { backgroundColor: Colors.bg3 },
  dot: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    height: 8, left: 8, marginTop: 7, position: 'absolute', width: 8,
  },
  body: { flex: 1, gap: 6 },
  top: { gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { ...Typography.uiSm, color: Colors.text1, flex: 1, lineHeight: 20 },
  titleUnread: { color: Colors.text0, fontWeight: '700' },
  time: { ...Typography.bodySm, color: Colors.text3, marginTop: 1 },
  msg: { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
});

function NotifSkeleton() {
  return (
    <View style={{ backgroundColor: Colors.bg2, borderColor: Colors.border1, borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i}>
          {i > 0 && <View style={{ backgroundColor: Colors.border0, height: 1 }} />}
          <View style={{ gap: 8, padding: 16 }}>
            <Skeleton height={13} width="65%" />
            <Skeleton height={11} />
            <Skeleton height={11} width="80%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 14, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 20 },
  header: { justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { ...Typography.label, color: Colors.accent, fontSize: 10 },
  title: { color: Colors.text0, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  markAllBtn: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  markAllTxt: { ...Typography.bodySm, color: Colors.accentLight, fontWeight: '600' },
  unreadBanner: { alignItems: 'center', backgroundColor: Colors.accentDim, borderColor: Colors.accentMid, borderRadius: Radius.sm, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 10 },
  unreadDot: { backgroundColor: Colors.accent, borderRadius: 5, height: 10, width: 10 },
  unreadTxt: { ...Typography.uiSm, color: Colors.accentLight },
});
