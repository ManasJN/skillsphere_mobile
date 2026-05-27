import { useCallback, useEffect, useState } from 'react';
import {
  Animated, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authAPI, leaderboardAPI } from '@/lib/api';
import { Colors, NAV_BOTTOM_OFFSET, Radius, Shadow, Typography } from '@/lib/theme';
import { Card, EmptyState, ErrorBanner, FadeView, Row, Skeleton } from '@/components/ui';
import { useFadeSlideIn, usePressScale } from '@/hooks/useAnimations';

type Leader = {
  _id: string; name?: string; department?: string;
  xpPoints?: number; streakDays?: number; verificationStatus?: string;
};

const MEDAL = ['1', '2', '3'];

function initials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '??';
}

export default function LeaderboardScreen() {
  const [leaders,    setLeaders]    = useState<Leader[]>([]);
  const [currentId,  setCurrentId]  = useState<string>('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [lbRes, meRes] = await Promise.all([
        leaderboardAPI.get(),
        authAPI.me().catch(() => null),
      ]);
      setLeaders((lbRes.data.data ?? lbRes.data ?? []).slice(0, 25));
      setCurrentId(meRes?.data?.user?._id ?? meRes?.data?.data?._id ?? '');
    } catch { setError('Could not load leaderboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const top3 = leaders.slice(0, 3);
  const rest  = leaders.slice(3);

  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      <ScrollView
        contentContainerStyle={S.content}
        refreshControl={<RefreshControl colors={[Colors.accent]} onRefresh={onRefresh} refreshing={refreshing} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <AnimatedHeader />

        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : leaders.length === 0 ? (
          <Card><EmptyState title="No rankings yet" body="Be the first to earn XP and claim the top spot!" /></Card>
        ) : (
          <FadeView delay={60}>
            {/* ── Podium ── */}
            {top3.length >= 3 && (
              <View style={S.topBlock}>
                <TopLeader leader={top3[0]} isMe={top3[0]._id === currentId} />
                <View style={S.runnerRows}>
                  <Runner leader={top3[1]} rank={2} isMe={top3[1]._id === currentId} />
                  <View style={S.divider} />
                  <Runner leader={top3[2]} rank={3} isMe={top3[2]._id === currentId} />
                </View>
              </View>
            )}

            {/* ── Rest of list ── */}
            {rest.length > 0 && (
              <View style={S.listCard}>
                {rest.map((leader, i) => (
                  <View key={leader._id}>
                    {i > 0 && <View style={S.divider} />}
                    <LeaderRow leader={leader} rank={i + 4} isMe={leader._id === currentId} />
                  </View>
                ))}
              </View>
            )}
          </FadeView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AnimatedHeader() {
  const { opacity, translateY } = useFadeSlideIn(0, 8);
  return (
    <Animated.View style={[S.header, { opacity, transform: [{ translateY }] }]}>
      <Text style={S.eyebrow}>This Week</Text>
      <Text style={S.title}>Leaderboard</Text>
      <Text style={S.sub}>Ranked by XP earned this week.</Text>
    </Animated.View>
  );
}

function TopLeader({ leader, isMe }: { leader: Leader; isMe?: boolean }) {
  return (
    <View style={[pS.topLeader, isMe && pS.pillarMe]}>
      <View style={pS.rankBadge}><Text style={pS.rankBadgeTxt}>1</Text></View>
      <View style={pS.avatarHero}>
        <Text style={pS.avatarTxtHero}>{initials(leader.name)}</Text>
      </View>
      <View style={pS.topCopy}>
        <Text style={pS.topName} numberOfLines={1}>{leader.name ?? '-'}</Text>
        <Text style={pS.topDept} numberOfLines={1}>{leader.department ?? 'Student'}</Text>
      </View>
      <View style={pS.topScore}>
        <Text style={pS.topXp}>{(leader.xpPoints ?? 0).toLocaleString()}</Text>
        <Text style={pS.xpLbl}>XP</Text>
      </View>
    </View>
  );
}

function Runner({ leader, rank, isMe }: { leader: Leader; rank: number; isMe?: boolean }) {
  return (
    <View style={[pS.runner, isMe && pS.runnerMe]}>
      <Text style={pS.medal}>{MEDAL[rank - 1]}</Text>
      <View style={[pS.avatar, isMe && pS.avatarMe]}>
        <Text style={pS.avatarTxt}>{initials(leader.name)}</Text>
      </View>
      <Text style={pS.name} numberOfLines={1}>{leader.name ?? '-'}</Text>
      <Text style={pS.xp}>{(leader.xpPoints ?? 0).toLocaleString()} XP</Text>
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Pillar({ leader, rank, hero, isMe }: { leader: Leader; rank: number; hero?: boolean; isMe?: boolean }) {
  return (
    <View style={[pS.pillar, hero && pS.pillarHero, isMe && pS.pillarMe]}>
      <Text style={pS.medal}>{MEDAL[rank - 1]}</Text>
      <View style={[pS.avatar, hero && pS.avatarHero, isMe && pS.avatarMe]}>
        <Text style={[pS.avatarTxt, hero && pS.avatarTxtHero]}>{initials(leader.name)}</Text>
      </View>
      <Text style={[pS.name, hero && pS.nameHero]} numberOfLines={1}>
        {leader.name?.split(' ')[0] ?? '–'}
      </Text>
      <Text style={pS.xp}>{(leader.xpPoints ?? 0).toLocaleString()}</Text>
      <Text style={pS.xpLbl}>XP</Text>
      {leader.streakDays ? (
        <View style={pS.streakPill}>
          <Text style={pS.streakTxt}>{leader.streakDays}d streak</Text>
        </View>
      ) : null}
    </View>
  );
}
const pS = StyleSheet.create({
  topLeader: {
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  rankBadgeTxt: { ...Typography.h4, color: Colors.bg1 },
  topCopy: { flex: 1, gap: 2 },
  topName: { ...Typography.h3, color: Colors.text0 },
  topDept: { ...Typography.bodySm, color: Colors.text3 },
  topScore: { alignItems: 'flex-end' },
  topXp: { ...Typography.statSm, color: Colors.accentLight },
  runner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  runnerMe: { backgroundColor: Colors.accentDim },
  pillar: {
    alignItems: 'center', backgroundColor: Colors.bg2, borderColor: Colors.border1,
    borderRadius: Radius.lg, borderWidth: 1, flex: 1, gap: 6, minWidth: 88,
    paddingHorizontal: 8, paddingVertical: 18,
  },
  pillarHero: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid, marginHorizontal: -4, paddingVertical: 24, zIndex: 1 },
  pillarMe: { borderColor: Colors.accent },
  medal: { fontSize: 26, marginBottom: 2 },
  avatar: { alignItems: 'center', backgroundColor: Colors.bg4, borderColor: Colors.border2, borderRadius: Radius.md, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  avatarHero: { backgroundColor: Colors.accentSoft, borderColor: Colors.accentMid, height: 54, width: 54, borderRadius: Radius.lg },
  avatarMe: { borderColor: Colors.accent },
  avatarTxt: { color: Colors.text2, fontSize: 15, fontWeight: '700' },
  avatarTxtHero: { color: Colors.accentLight, fontSize: 18 },
  name: { ...Typography.uiSm, color: Colors.text1, textAlign: 'center' },
  nameHero: { color: Colors.text0, fontWeight: '700' },
  xp: { ...Typography.h4, color: Colors.text0 },
  xpLbl: { ...Typography.label, color: Colors.text3, fontSize: 9, marginTop: -2 },
  streakPill: { backgroundColor: Colors.bg4, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  streakTxt: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },
});

function LeaderRow({ leader, rank, isMe }: { leader: Leader; rank: number; isMe: boolean }) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.985);
  return (
    <Animated.View
      onTouchStart={onPressIn}
      onTouchEnd={onPressOut}
      style={[{ transform: [{ scale }] }]}>
      <Row style={[rS.row, isMe && rS.rowMe]}>
      <Text style={[rS.rank, isMe && rS.rankMe]}>{rank}</Text>
      <View style={[rS.avatar, isMe && rS.avatarMe]}>
        <Text style={[rS.avatarTxt, isMe && rS.avatarTxtMe]}>{initials(leader.name)}</Text>
      </View>
      <View style={rS.info}>
        <Row style={{ gap: 6 }}>
          <Text style={[rS.name, isMe && rS.nameMe]}>{leader.name ?? '–'}</Text>
          {isMe && <View style={rS.youBadge}><Text style={rS.youTxt}>You</Text></View>}
        </Row>
        <Text style={rS.dept} numberOfLines={1}>{leader.department ?? 'Student'}</Text>
      </View>
      <View style={rS.right}>
        <Text style={[rS.xp, isMe && rS.xpMe]}>{(leader.xpPoints ?? 0).toLocaleString()}</Text>
        <Text style={rS.xpLbl}>XP</Text>
      </View>
    </Row>
    </Animated.View>
  );
}
const rS = StyleSheet.create({
  row: { gap: 12, padding: 14 },
  rowMe: { backgroundColor: Colors.accentDim },
  rank: { color: Colors.text3, fontSize: 13, fontWeight: '700', textAlign: 'center', width: 22 },
  rankMe: { color: Colors.accentLight },
  avatar: { alignItems: 'center', backgroundColor: Colors.bg4, borderRadius: Radius.sm, height: 38, justifyContent: 'center', width: 38 },
  avatarMe: { backgroundColor: Colors.accentSoft },
  avatarTxt: { color: Colors.text2, fontSize: 13, fontWeight: '700' },
  avatarTxtMe: { color: Colors.accentLight },
  info: { flex: 1, gap: 2 },
  name: { ...Typography.uiSm, color: Colors.text0 },
  nameMe: { color: Colors.accentLight },
  youBadge: { backgroundColor: Colors.accentMid, borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  youTxt: { ...Typography.label, color: Colors.accentLight, fontSize: 9 },
  dept: { ...Typography.bodySm, color: Colors.text3 },
  right: { alignItems: 'flex-end', gap: 1 },
  xp: { color: Colors.text0, fontSize: 15, fontWeight: '700' },
  xpMe: { color: Colors.accentLight },
  xpLbl: { ...Typography.label, color: Colors.text3, fontSize: 9 },
});

function LeaderboardSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <View style={[S.podiumWrap, { gap: 8 }]}>
        {[0, 1, 2].map(i => <Skeleton key={i} height={180} radius={16} style={{ flex: 1 }} />)}
      </View>
      <View style={S.listCard}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i}>
            {i > 0 && <View style={S.divider} />}
            <Row style={{ gap: 12, padding: 14 }}>
              <Skeleton width={22} height={14} />
              <Skeleton width={38} height={38} radius={8} />
              <View style={{ flex: 1, gap: 7 }}>
                <Skeleton height={13} width="55%" />
                <Skeleton height={11} width="35%" />
              </View>
            </Row>
          </View>
        ))}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  content: { gap: 16, paddingBottom: NAV_BOTTOM_OFFSET + 20, paddingHorizontal: 18, paddingTop: 20 },
  header: { gap: 6 },
  eyebrow: { ...Typography.label, color: Colors.accent, fontSize: 10 },
  title: { ...Typography.h2, color: Colors.text0 },
  sub: { ...Typography.bodySm, color: Colors.text3, lineHeight: 20 },
  podiumWrap: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
  topBlock: { gap: 10 },
  runnerRows: {
    borderBottomColor: Colors.border0,
    borderBottomWidth: 1,
    borderTopColor: Colors.border0,
    borderTopWidth: 1,
    paddingHorizontal: 2,
  },
  listCard: { borderTopColor: Colors.border0, borderTopWidth: 1, overflow: 'hidden', ...Shadow.none },
  divider: { backgroundColor: Colors.border0, height: 1 },
});
