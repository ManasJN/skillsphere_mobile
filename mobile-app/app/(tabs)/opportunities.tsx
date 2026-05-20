import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { opportunitiesAPI } from '@/lib/api';
import { Colors, Radius, Shadow, Typography } from '@/lib/theme';
import { Badge, BadgeColor, Card, EmptyState, ErrorBanner, Row, Skeleton, SkeletonCard } from '@/components/ui';

type Opportunity = {
  _id: string; title?: string; company?: string; type?: string;
  description?: string; requiredSkills?: string[]; deadline?: string;
  location?: string; stipend?: string; duration?: string;
  matchScore?: number; applications?: { status?: string }[];
};

const FILTERS = ['All', 'Internship', 'Hackathon', 'Job', 'Research', 'Scholarship'] as const;
type Filter = typeof FILTERS[number];

function oppBadge(t?: string): BadgeColor {
  return ({
    internship: 'teal', hackathon: 'indigo', job: 'green',
    research: 'blue', scholarship: 'amber',
  } as const)[t?.toLowerCase() ?? ''] ?? 'muted';
}

function fmtDeadline(d?: string) {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0)  return { label: 'Closed', color: Colors.danger };
  if (days === 0) return { label: 'Today', color: Colors.warning };
  if (days <= 3)  return { label: `${days}d left`, color: Colors.warning };
  return { label: `${days}d left`, color: Colors.text3 };
}

export default function OpportunitiesScreen() {
  const [opps,       setOpps]       = useState<Opportunity[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<Filter>('All');
  const [applying,   setApplying]   = useState<string | null>(null);
  const [applied,    setApplied]    = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError('');
    try {
      const params: Record<string, string> = { limit: '20' };
      if (filter !== 'All') params.type = filter.toLowerCase();
      if (search.trim())    params.search = search.trim();
      const res = await opportunitiesAPI.getAll(params);
      setOpps(res.data.data ?? []);
    } catch { setError('Could not load opportunities. Pull to refresh.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter, search]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleApply = async (id: string) => {
    setApplying(id);
    try {
      await opportunitiesAPI.apply(id);
      setApplied(prev => new Set([...prev, id]));
    } catch { /* show nothing — apply might fail if already applied */ }
    finally { setApplying(null); }
  };

  const visible = search.trim()
    ? opps.filter(o =>
        o.title?.toLowerCase().includes(search.toLowerCase()) ||
        o.company?.toLowerCase().includes(search.toLowerCase()))
    : opps;

  return (
    <SafeAreaView edges={['top']} style={S.safe}>
      {/* ── Fixed Header ── */}
      <View style={S.header}>
        <View style={S.headerTop}>
          <View>
            <Text style={S.eyebrow}>Discover</Text>
            <Text style={S.title}>Opportunities</Text>
          </View>
          {!loading && <Text style={S.count}>{visible.length} open</Text>}
        </View>

        {/* Search */}
        <View style={S.searchBox}>
          <Text style={S.searchIcon}>🔍</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Search by title or company"
            placeholderTextColor={Colors.text4}
            style={S.searchInput}
            value={search}
          />
          {search.length > 0 && (
            <Pressable hitSlop={10} onPress={() => setSearch('')}>
              <Text style={S.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filters}>
          {FILTERS.map(f => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[S.filterChip, active && S.filterChipActive]}>
                <Text style={[S.filterTxt, active && S.filterTxtActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── List ── */}
      <ScrollView
        contentContainerStyle={S.list}
        refreshControl={<RefreshControl colors={[Colors.accent]} onRefresh={onRefresh} refreshing={refreshing} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}>

        {error ? <ErrorBanner message={error} /> : null}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <OppSkeleton key={i} />)
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState emoji="📭" title="No opportunities found" body="Try a different filter or check back soon for new postings." />
          </Card>
        ) : (
          visible.map(opp => (
            <OppCard
              key={opp._id}
              opp={opp}
              applying={applying === opp._id}
              alreadyApplied={applied.has(opp._id)}
              onApply={() => handleApply(opp._id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OppCard({ opp, applying, alreadyApplied, onApply }: {
  opp: Opportunity; applying: boolean; alreadyApplied: boolean; onApply: () => void;
}) {
  const deadline = fmtDeadline(opp.deadline);
  const hasApplied = alreadyApplied || (opp.applications?.some(a => a.status === 'pending') ?? false);

  return (
    <View style={cS.card}>
      {/* Header row */}
      <Row style={cS.top}>
        <View style={cS.orgBadge}>
          <Text style={cS.orgInitial}>
            {(opp.company ?? opp.title ?? '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={cS.title} numberOfLines={2}>{opp.title}</Text>
          {opp.company && <Text style={cS.company}>{opp.company}</Text>}
        </View>
        <View style={{ gap: 6, alignItems: 'flex-end' }}>
          <Badge label={opp.type ?? 'opportunity'} color={oppBadge(opp.type)} />
          {opp.matchScore != null && (
            <View style={cS.matchBadge}>
              <Text style={cS.matchTxt}>{opp.matchScore}% match</Text>
            </View>
          )}
        </View>
      </Row>

      {/* Description */}
      {opp.description && (
        <Text style={cS.desc} numberOfLines={2}>{opp.description}</Text>
      )}

      {/* Meta chips */}
      <Row style={cS.meta}>
        {opp.location   && <MetaChip label={`📍 ${opp.location}`} />}
        {opp.duration   && <MetaChip label={`⏱ ${opp.duration}`} />}
        {opp.stipend    && <MetaChip label={`💰 ${opp.stipend}`} />}
      </Row>

      {/* Required skills */}
      {(opp.requiredSkills?.length ?? 0) > 0 && (
        <Row style={cS.skills}>
          {opp.requiredSkills!.slice(0, 5).map(sk => (
            <View key={sk} style={cS.skillChip}>
              <Text style={cS.skillTxt}>{sk}</Text>
            </View>
          ))}
          {opp.requiredSkills!.length > 5 && (
            <Text style={cS.skillMore}>+{opp.requiredSkills!.length - 5}</Text>
          )}
        </Row>
      )}

      {/* Footer */}
      <Row style={cS.footer}>
        {deadline
          ? <Text style={[cS.deadline, { color: deadline.color }]}>{deadline.label}</Text>
          : <View />}
        <Pressable
          disabled={hasApplied || applying}
          onPress={onApply}
          style={[cS.applyBtn, (hasApplied || applying) && cS.applyBtnDone]}>
          {applying
            ? <ActivityIndicator color={Colors.bg0} size="small" />
            : <Text style={[cS.applyTxt, (hasApplied || applying) && cS.applyTxtDone]}>
                {hasApplied ? '✓ Applied' : 'Apply now'}
              </Text>}
        </Pressable>
      </Row>
    </View>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <View style={cS.metaChip}>
      <Text style={cS.metaTxt}>{label}</Text>
    </View>
  );
}

function OppSkeleton() {
  return (
    <View style={[cS.card, { gap: 12 }]}>
      <Row style={{ gap: 12 }}>
        <Skeleton width={44} height={44} radius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={14} width="70%" />
          <Skeleton height={11} width="45%" />
        </View>
      </Row>
      <Skeleton height={11} />
      <Skeleton height={11} width="80%" />
      <Row style={{ gap: 8 }}>
        <Skeleton height={28} width={80} radius={20} />
        <Skeleton height={28} width={80} radius={20} />
      </Row>
    </View>
  );
}

const S = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  header: { backgroundColor: Colors.bg1, gap: 14, paddingBottom: 14, paddingHorizontal: 18, paddingTop: 18 },
  headerTop: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { ...Typography.label, color: Colors.accent, fontSize: 10 },
  title: { color: Colors.text0, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  count: { ...Typography.bodySm, color: Colors.text3, marginBottom: 4 },
  searchBox: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: 10,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { color: Colors.text0, flex: 1, fontSize: 15, height: 48 },
  searchClear: { color: Colors.text3, fontSize: 16, paddingHorizontal: 4 },
  filters: { gap: 8 },
  filterChip: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1, borderRadius: Radius.full,
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  filterTxt: { ...Typography.uiSm, color: Colors.text2 },
  filterTxtActive: { color: Colors.accentLight, fontWeight: '700' },
  list: { gap: 12, paddingBottom: 40, paddingHorizontal: 18 },
});

const cS = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2, borderColor: Colors.border1, borderRadius: Radius.xl,
    borderWidth: 1, gap: 14, padding: 18, ...Shadow.sm,
  } as any,
  top: { gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' },
  orgBadge: {
    alignItems: 'center', backgroundColor: Colors.bg4, borderColor: Colors.border2,
    borderRadius: Radius.md, borderWidth: 1, height: 44, justifyContent: 'center', width: 44,
  },
  orgInitial: { color: Colors.text0, fontSize: 18, fontWeight: '800' },
  title: { ...Typography.h3, color: Colors.text0, lineHeight: 22 },
  company: { ...Typography.bodySm, color: Colors.text3 },
  matchBadge: {
    backgroundColor: Colors.accentDim, borderColor: Colors.accentMid,
    borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3,
  },
  matchTxt: { ...Typography.mono, color: Colors.accentLight },
  desc: { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  meta: { flexWrap: 'wrap', gap: 8 },
  metaChip: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1, borderRadius: Radius.full,
    borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  metaTxt: { ...Typography.bodySm, color: Colors.text2 },
  skills: { flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: Colors.bg4, borderColor: Colors.border1, borderRadius: Radius.full,
    borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
  },
  skillTxt: { ...Typography.bodySm, color: Colors.text3, fontWeight: '600' },
  skillMore: { ...Typography.bodySm, color: Colors.text3, lineHeight: 28 },
  footer: { justifyContent: 'space-between', marginTop: 2 },
  deadline: { ...Typography.uiSm },
  applyBtn: {
    alignItems: 'center', backgroundColor: Colors.accent, borderRadius: Radius.sm,
    height: 38, justifyContent: 'center', paddingHorizontal: 20,
    ...Shadow.accent,
  },
  applyBtnDone: { backgroundColor: Colors.bg4, borderColor: Colors.border2, borderWidth: 1, shadowOpacity: 0 },
  applyTxt: { color: Colors.bg0, fontSize: 13, fontWeight: '800' },
  applyTxtDone: { color: Colors.text3 },
} as any);

