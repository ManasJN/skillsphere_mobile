import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { leaderboardAPI } from '@/lib/api';
import { Card, SectionTitle, SkillScreen, palette } from './_components/skill-screen';

type LeaderboardUser = {
  _id: string;
  name: string;
  department?: string;
  xpPoints: number;
  rank?: number;
};

export default function LeaderboardScreen() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await leaderboardAPI.get();
      const data: LeaderboardUser[] = res.data.data ?? res.data ?? [];
      setLeaders(data.slice(0, 10));
    } catch {
      setError('Could not load leaderboard. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <SkillScreen
      eyebrow="Leaderboard"
      subtitle="Compare weekly progress with classmates across every learning track."
      title="Top Learners"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5EEAD4" colors={['#5EEAD4']} />
      }>
      {loading ? (
        <Card>
          <ActivityIndicator color="#5EEAD4" />
          <Text style={styles.muted}>Loading leaderboard…</Text>
        </Card>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.section}>
          <SectionTitle>Rankings</SectionTitle>
          {leaders.map((user, index) => (
            <View key={user._id} style={styles.row}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.learnerInfo}>
                <Text style={styles.learnerName}>{user.name}</Text>
                <Text style={styles.learnerTrack}>{user.department ?? 'Student'}</Text>
              </View>
              <Text style={styles.points}>{user.xpPoints} XP</Text>
            </View>
          ))}
          {leaders.length === 0 && (
            <Text style={styles.muted}>No leaderboard data yet.</Text>
          )}
        </View>
      )}
    </SkillScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  row: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  rankText: { color: palette.text, fontSize: 16, fontWeight: '900' },
  learnerInfo: { flex: 1, gap: 3 },
  learnerName: { color: palette.text, fontSize: 16, fontWeight: '800' },
  learnerTrack: { color: palette.mutedDark, fontSize: 13, fontWeight: '700' },
  points: { color: palette.accent, fontSize: 14, fontWeight: '900' },
  muted: { color: palette.muted, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  error: {
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
