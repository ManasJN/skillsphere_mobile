import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';
import { Card, Metric, SectionTitle, SkillScreen, palette } from './_components/skill-screen';

type User = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  semester?: number | string;
  rollNumber?: string;
  cgpa?: number | string;
  xpPoints?: number;
  level?: number;
  streakDays?: number;
  verificationStatus?: string;
};

function getInitials(name = '') {
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SS'
  );
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await authAPI.me();
      const u: User = res.data.user ?? res.data.data ?? res.data;
      setUser(u);
    } catch {
      setError('Could not load profile. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch { /* ignore */ } finally {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      router.replace('/login');
    }
  };

  return (
    <SkillScreen
      eyebrow="Profile"
      subtitle="Your account details, stats, and settings."
      title={user?.name ?? 'Profile'}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5EEAD4" colors={['#5EEAD4']} />
      }>
      {loading ? (
        <Card>
          <ActivityIndicator color="#5EEAD4" />
          <Text style={styles.muted}>Loading profile…</Text>
        </Card>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <Card>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.name}>{user?.name ?? 'Student'}</Text>
                <Text style={styles.meta}>{user?.email}</Text>
                <Text style={styles.meta}>
                  {user?.role ?? 'student'} · {user?.department ?? 'Department'}
                </Text>
              </View>
            </View>
          </Card>

          <View style={styles.metricRow}>
            <Card>
              <Metric label="XP Points" value={String(user?.xpPoints ?? 0)} />
            </Card>
            <Card>
              <Metric label="Streak" value={`${user?.streakDays ?? 0}d`} />
            </Card>
          </View>

          {(user?.semester || user?.rollNumber || user?.cgpa) && (
            <View style={styles.section}>
              <SectionTitle>Academic Info</SectionTitle>
              {[
                ['Semester', user?.semester],
                ['Roll Number', user?.rollNumber],
                ['CGPA', user?.cgpa],
              ]
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([label, value]) => (
                  <View key={String(label)} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{String(value)}</Text>
                  </View>
                ))}
            </View>
          )}

          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </>
      )}
    </SkillScreen>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  avatar: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: { color: palette.accent, fontSize: 20, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 4 },
  name: { color: palette.text, fontSize: 20, fontWeight: '900' },
  meta: { color: palette.mutedDark, fontSize: 13, fontWeight: '600' },
  metricRow: { flexDirection: 'row', gap: 8 },
  section: { gap: 10 },
  infoRow: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  infoLabel: { color: palette.muted, fontSize: 14, fontWeight: '700' },
  infoValue: { color: palette.text, fontSize: 14, fontWeight: '800' },
  logoutBtn: {
    alignItems: 'center',
    backgroundColor: '#1A0A0A',
    borderColor: '#7F1D1D',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  logoutText: { color: '#FCA5A5', fontSize: 16, fontWeight: '900' },
  muted: { color: palette.muted, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
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
