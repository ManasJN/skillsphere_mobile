import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { notificationsAPI } from '@/lib/api';
import { Card, SectionTitle, SkillScreen, palette } from './_components/skill-screen';

type Notification = {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await notificationsAPI.getMine();
      setNotifications(res.data.data ?? res.data ?? []);
    } catch {
      setError('Could not load notifications. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SkillScreen
      eyebrow="Notifications"
      subtitle="Stay current on deadlines, mentor feedback, and cohort activity."
      title="Updates"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5EEAD4" colors={['#5EEAD4']} />
      }>
      {loading ? (
        <Card>
          <ActivityIndicator color="#5EEAD4" />
          <Text style={styles.muted}>Loading notifications…</Text>
        </Card>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          {unreadCount > 0 && (
            <Card>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryTitle}>{unreadCount} unread</Text>
                  <Text style={styles.muted}>Tap below to view details</Text>
                </View>
                <Pressable onPress={markAllRead} style={styles.markBtn}>
                  <Text style={styles.markBtnText}>Mark all read</Text>
                </Pressable>
              </View>
            </Card>
          )}

          <View style={styles.section}>
            <SectionTitle>Recent</SectionTitle>
            {notifications.length === 0 ? (
              <Text style={styles.muted}>No notifications yet.</Text>
            ) : (
              notifications.map((notif) => (
                <View key={notif._id} style={[styles.notification, !notif.isRead && styles.unread]}>
                  {!notif.isRead && <View style={styles.dot} />}
                  <View style={styles.notificationCopy}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{notif.title}</Text>
                      <Text style={styles.notificationTime}>{formatRelative(notif.createdAt)}</Text>
                    </View>
                    <Text style={styles.notificationBody}>{notif.message}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </SkillScreen>
  );
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryTitle: { color: palette.text, fontSize: 20, fontWeight: '900' },
  markBtn: {
    backgroundColor: '#134E4A',
    borderColor: '#5EEAD4',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markBtnText: { color: '#5EEAD4', fontSize: 12, fontWeight: '900' },
  notification: {
    alignItems: 'flex-start',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  unread: { borderColor: '#1E4A60' },
  dot: {
    backgroundColor: palette.accent,
    borderRadius: 6,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  notificationCopy: { flex: 1, gap: 6 },
  notificationHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  notificationTitle: { color: palette.text, flex: 1, fontSize: 15, fontWeight: '900' },
  notificationTime: { color: palette.mutedDark, fontSize: 12, fontWeight: '800' },
  notificationBody: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  muted: { color: palette.muted, fontSize: 14, paddingVertical: 6 },
  errorText: {
    backgroundColor: '#451A1A',
    borderColor: '#7F1D1D',
    borderRadius: 8,
    borderWidth: 1,
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '700',
    padding: 12,
  },
});
