import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { notificationsAPI } from '@/lib/api';
import { Colors, Radius, Typography } from '@/lib/theme';
import { Badge, Card, EmptyState, Row } from '@/components/ui';

type Notification = {
  _id: string; title: string; message: string; isRead: boolean;
  createdAt: string; type?: string;
};

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function typeColor(type?: string): Parameters<typeof Badge>[0]['color'] {
  return ({
    achievement: 'teal', goal: 'indigo', system: 'muted', event: 'amber', mentor: 'blue',
  } as const)[type ?? ''] ?? 'muted';
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  const unread = items.filter(n => !n.isRead);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl colors={[Colors.accent]} onRefresh={onRefresh} refreshing={refreshing} tintColor={Colors.accent} />
        }
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Row style={styles.headerRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.eyebrow}>Activity</Text>
            <Text style={styles.title}>Notifications</Text>
          </View>
          {unread.length > 0 && (
            <Pressable onPress={markAllRead} style={styles.markAllBtn} hitSlop={10}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </Row>

        {/* Unread count badge */}
        {unread.length > 0 && (
          <View style={styles.unreadBanner}>
            <View style={styles.unreadDot} />
            <Text style={styles.unreadText}>
              {unread.length} unread notification{unread.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.loadingText}>Fetching updates…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}><Text style={styles.errorMsg}>{error}</Text></View>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              title="All caught up"
              body="You'll see goal updates, achievements, and announcements here."
            />
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {items.map((notif, i) => (
              <View key={notif._id}>
                {i > 0 && <View style={styles.divider} />}
                <NotifRow notif={notif} />
              </View>
            ))}
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function NotifRow({ notif }: { notif: Notification }) {
  return (
    <View style={[rowStyles.wrap, !notif.isRead && rowStyles.unread]}>
      {!notif.isRead && <View style={rowStyles.dot} />}
      <View style={rowStyles.body}>
        <Row style={rowStyles.top}>
          <Text style={rowStyles.title} numberOfLines={1}>{notif.title}</Text>
          <Text style={rowStyles.time}>{formatRelative(notif.createdAt)}</Text>
        </Row>
        <Text style={rowStyles.message} numberOfLines={3}>{notif.message}</Text>
        {notif.type && (
          <Badge label={notif.type} color={typeColor(notif.type)} />
        )}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', gap: 12, padding: 16, paddingLeft: 20,
  },
  unread: { backgroundColor: '#0A1018' },
  dot: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    height: 8, marginTop: 6, position: 'absolute', left: 8, width: 8,
  },
  body: { flex: 1, gap: 6 },
  top: { gap: 8, justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { ...Typography.uiSm, color: Colors.text0, flex: 1, lineHeight: 19 },
  time: { ...Typography.bodySm, color: Colors.text3, marginTop: 1 },
  message: { ...Typography.bodySm, color: Colors.text2, lineHeight: 19 },
});

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 14, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 20 },

  headerRow: { justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { ...Typography.label, color: Colors.accent, fontSize: 10 },
  title: { color: Colors.text0, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  markAllBtn: {
    backgroundColor: Colors.accentDim, borderColor: '#1A4A40', borderRadius: Radius.full,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6,
  },
  markAllText: { ...Typography.bodySm, color: Colors.accentText, fontWeight: '600' },

  unreadBanner: {
    alignItems: 'center', backgroundColor: Colors.accentDim, borderColor: '#1A4A40',
    borderRadius: Radius.sm, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 10,
  },
  unreadDot: { backgroundColor: Colors.accent, borderRadius: 5, height: 10, width: 10 },
  unreadText: { ...Typography.uiSm, color: Colors.accentText },

  loadingWrap: { alignItems: 'center', gap: 14, paddingVertical: 60 },
  loadingText: { ...Typography.body, color: Colors.text3 },

  errorBox: {
    backgroundColor: '#1C0000', borderColor: '#4C0519', borderRadius: Radius.sm,
    borderWidth: 1, padding: 16,
  },
  errorMsg: { ...Typography.bodySm, color: Colors.danger, textAlign: 'center' },

  listCard: { gap: 0, padding: 0, overflow: 'hidden' },
  divider: { backgroundColor: Colors.border0, height: 1 },
});
