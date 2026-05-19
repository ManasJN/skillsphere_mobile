import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { leaderboardAPI } from '@/lib/api';
import { Colors, Radius, Typography } from '@/lib/theme';
import { Badge, Card, EmptyState, Row } from '@/components/ui';

type Leader = {
  _id: string; name?: string; department?: string; xpPoints?: number;
  streakDays?: number; verificationStatus?: string;
};

const MEDAL = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await leaderboardAPI.get();
      setLeaders((res.data.data ?? res.data ?? []).slice(0, 20));
    } catch { setError('Could not load leaderboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const top3 = leaders.slice(0, 3);
  const rest  = leaders.slice(3);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl colors={[Colors.accent]} onRefresh={onRefresh} refreshing={refreshing} tintColor={Colors.accent} />
        }
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>This Week</Text>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.sub}>Top performers ranked by XP earned across all tracks.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.loadingText}>Ranking students…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : leaders.length === 0 ? (
          <Card><EmptyState title="No rankings yet" body="Be the first to earn XP and claim the top spot." /></Card>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <View style={styles.podium}>
                {/* 2nd */}
                <PodiumPillar leader={top3[1]} rank={2} />
                {/* 1st */}
                <PodiumPillar leader={top3[0]} rank={1} hero />
                {/* 3rd */}
                <PodiumPillar leader={top3[2]} rank={3} />
              </View>
            )}

            {/* Rest of list */}
            {rest.length > 0 && (
              <Card style={styles.listCard}>
                {rest.map((leader, i) => (
                  <View key={leader._id}>
                    {i > 0 && <View style={styles.divider} />}
                    <LeaderRow leader={leader} rank={i + 4} />
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PodiumPillar({ leader, rank, hero }: { leader: Leader; rank: number; hero?: boolean }) {
  const initials = (leader.name ?? '??').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[podiumStyles.pillar, hero && podiumStyles.pillarHero]}>
      <Text style={podiumStyles.medal}>{MEDAL[rank - 1]}</Text>
      <View style={[podiumStyles.avatar, hero && podiumStyles.avatarHero]}>
        <Text style={[podiumStyles.avatarText, hero && podiumStyles.avatarTextHero]}>{initials}</Text>
      </View>
      <Text style={[podiumStyles.name, hero && podiumStyles.nameHero]} numberOfLines={1}>
        {leader.name?.split(' ')[0] ?? '–'}
      </Text>
      <Text style={podiumStyles.xp}>{(leader.xpPoints ?? 0).toLocaleString()}</Text>
      <Text style={podiumStyles.xpLabel}>XP</Text>
    </View>
  );
}
const podiumStyles = StyleSheet.create({
  pillar: {
    alignItems: 'center', backgroundColor: Colors.bg2, borderColor: Colors.border1,
    borderRadius: Radius.lg, borderWidth: 1, flex: 1, gap: 6, paddingVertical: 18, paddingHorizontal: 8,
  },
  pillarHero: {
    backgroundColor: Colors.accentDim, borderColor: '#1A4A40',
    marginHorizontal: -4, paddingVertical: 24, zIndex: 1,
  },
  medal: { fontSize: 24 },
  avatar: {
    alignItems: 'center', backgroundColor: Colors.bg4, borderRadius: Radius.md,
    height: 44, justifyContent: 'center', width: 44,
  },
  avatarHero: { backgroundColor: Colors.accentSoft, height: 52, width: 52, borderRadius: Radius.lg },
  avatarText: { color: Colors.text2, fontSize: 15, fontWeight: '800' },
  avatarTextHero: { color: Colors.accentText, fontSize: 18 },
  name: { ...Typography.uiSm, color: Colors.text1, textAlign: 'center' },
  nameHero: { color: Colors.text0, fontWeight: '700' },
  xp: { color: Colors.text0, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  xpLabel: { ...Typography.label, color: Colors.text3, fontSize: 9 },
});

function LeaderRow({ leader, rank }: { leader: Leader; rank: number }) {
  const initials = (leader.name ?? '??').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <Row style={styles.leaderRow}>
      <Text style={styles.rankNum}>{rank}</Text>
      <View style={styles.leaderAvatar}>
        <Text style={styles.leaderAvatarText}>{initials}</Text>
      </View>
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName}>{leader.name ?? '–'}</Text>
        <Text style={styles.leaderDept} numberOfLines={1}>{leader.department ?? 'Student'}</Text>
      </View>
      <View style={styles.leaderRight}>
        <Text style={styles.leaderXP}>{(leader.xpPoints ?? 0).toLocaleString()}</Text>
        <Text style={styles.leaderXPLabel}>XP</Text>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 16, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 20 },

  header: { gap: 6 },
  eyebrow: { ...Typography.label, color: Colors.accent, fontSize: 10 },
  title: { color: Colors.text0, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  sub: { ...Typography.bodySm, color: Colors.text3, lineHeight: 20 },

  loadingWrap: { alignItems: 'center', gap: 14, paddingVertical: 60 },
  loadingText: { ...Typography.body, color: Colors.text3 },

  errorBox: {
    backgroundColor: '#1C0000', borderColor: '#4C0519', borderRadius: Radius.sm,
    borderWidth: 1, padding: 16,
  },
  errorMsg: { ...Typography.bodySm, color: Colors.danger, textAlign: 'center' },

  podium: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },

  listCard: { gap: 0, padding: 0, overflow: 'hidden' },
  divider: { backgroundColor: Colors.border0, height: 1, marginHorizontal: 16 },

  leaderRow: { gap: 12, padding: 14 },
  rankNum: { color: Colors.text3, fontSize: 13, fontWeight: '700', width: 22, textAlign: 'center' },
  leaderAvatar: {
    alignItems: 'center', backgroundColor: Colors.bg4, borderRadius: Radius.sm,
    height: 38, justifyContent: 'center', width: 38,
  },
  leaderAvatarText: { color: Colors.text2, fontSize: 13, fontWeight: '800' },
  leaderInfo: { flex: 1, gap: 2 },
  leaderName: { ...Typography.uiSm, color: Colors.text0 },
  leaderDept: { ...Typography.bodySm, color: Colors.text3 },
  leaderRight: { alignItems: 'flex-end', gap: 1 },
  leaderXP: { color: Colors.accentText, fontSize: 16, fontWeight: '800' },
  leaderXPLabel: { ...Typography.label, color: Colors.text3, fontSize: 9 },
});
