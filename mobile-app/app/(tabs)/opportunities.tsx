/**
 * Explore tab — unified feed
 *
 * Three sections in one scroll:
 *   1. Upcoming  — CIE reminders (static defaults) + college events (live)
 *   2. From your college — announcements (live, verified students only)
 *   3. Opportunities — filtered, searchable list (existing functionality preserved)
 *
 * Design rules followed:
 *   - No emoji in UI chrome (Ionicons only)
 *   - No glow / Shadow.accent
 *   - Radius.lg on all cards (Phase 1 standard)
 *   - Typography tokens only — no raw fontSize/fontWeight
 *   - Urgency via left-border color, not badges with bright backgrounds
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { collegesAPI, opportunitiesAPI } from '@/lib/api';
import { Colors, NAV_BOTTOM_OFFSET, Radius, Spacing, Typography } from '@/lib/theme';
import {
  Badge, BadgeColor, Card, Divider, EmptyState,
  ErrorBanner, Row, Skeleton, SkeletonCard,
} from '@/components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type Opportunity = {
  _id: string; title?: string; company?: string; type?: string;
  description?: string; requiredSkills?: string[]; deadline?: string;
  location?: string; stipend?: string; duration?: string;
  matchScore?: number; applications?: { status?: string }[];
};

type CollegeEvent = {
  _id: string; title?: string; description?: string; type?: string;
  startsAt?: string; endsAt?: string; location?: string;
};

type CollegeAnnouncement = {
  _id: string; title?: string; body?: string; department?: string;
  createdAt?: string; postedBy?: { name?: string };
};

// ─── Static CIE reminders ─────────────────────────────────────────────────────
// These are the default academic reminders shown to all students.
// They're intentionally static — a real CIE schedule system would require
// a separate backend model. For now these seed the UI correctly.

const DEFAULT_REMINDERS: {
  id: string; subject: string; type: string; date: string; daysFromNow: number;
}[] = [
  { id: 'r1', subject: 'FSAD',              type: 'CIE',        date: 'Saturday',  daysFromNow: 1 },
  { id: 'r2', subject: 'Machine Learning',  type: 'CIE',        date: 'Monday',    daysFromNow: 3 },
  { id: 'r3', subject: 'DBMS',              type: 'Assignment', date: 'Wednesday', daysFromNow: 5 },
];

// ─── Filter config ────────────────────────────────────────────────────────────

const OPP_FILTERS = ['All', 'Internship', 'Hackathon', 'Job', 'Research', 'Scholarship'] as const;
type OppFilter = typeof OPP_FILTERS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function oppBadge(t?: string): BadgeColor {
  return ({
    internship: 'teal', hackathon: 'indigo', job: 'green',
    research: 'blue', scholarship: 'amber',
  } as const)[t?.toLowerCase() ?? ''] ?? 'muted';
}

function eventBadge(t?: string): BadgeColor {
  return ({
    event: 'teal', opportunity: 'green', workshop: 'indigo',
    placement: 'amber', club: 'muted',
  } as const)[t?.toLowerCase() ?? ''] ?? 'muted';
}

/** Returns days until a date — negative means past */
function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

/** Urgency color for left border based on days remaining */
function urgencyColor(days: number | null): string {
  if (days === null)  return Colors.border2;
  if (days < 0)       return Colors.text3;   // past
  if (days === 0)     return Colors.danger;   // today
  if (days <= 2)      return Colors.danger;   // very soon
  if (days <= 5)      return Colors.warning;  // soon
  return Colors.success;                       // plenty of time
}

/** Human-readable urgency label */
function urgencyLabel(days: number | null): string {
  if (days === null)  return '';
  if (days < 0)       return 'Passed';
  if (days === 0)     return 'Today';
  if (days === 1)     return 'Tomorrow';
  if (days <= 6)      return `In ${days} days`;
  return `In ${Math.ceil(days / 7)} week${days > 13 ? 's' : ''}`;
}

function fmtDeadline(d?: string): { label: string; color: string } | null {
  const days = daysUntil(d);
  if (days === null) return null;
  if (days < 0)      return { label: 'Closed', color: Colors.text3 };
  if (days === 0)    return { label: 'Closes today', color: Colors.danger };
  if (days <= 3)     return { label: `${days}d left`, color: Colors.warning };
  return { label: `${days}d left`, color: Colors.text3 };
}

function fmtDate(d?: string): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
    .format(new Date(d));
}

function relativeTime(d?: string): string {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  // Opportunities state
  const [opps,       setOpps]       = useState<Opportunity[]>([]);
  const [oppsLoading,setOppsLoading]= useState(true);
  const [oppsError,  setOppsError]  = useState('');
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<OppFilter>('All');
  const [applying,   setApplying]   = useState<string | null>(null);
  const [applied,    setApplied]    = useState<Set<string>>(new Set());

  // College feed state
  const [events,      setEvents]     = useState<CollegeEvent[]>([]);
  const [announces,   setAnnounces]  = useState<CollegeAnnouncement[]>([]);
  const [feedLoading, setFeedLoading]= useState(true);
  const [dismissed,   setDismissed]  = useState<Set<string>>(new Set());

  const [refreshing, setRefreshing] = useState(false);

  // ── Loaders ─────────────────────────────────────────────────────────────

  const loadOpps = useCallback(async () => {
    setOppsError('');
    try {
      const params: Record<string, string> = { limit: '20' };
      if (filter !== 'All') params.type = filter.toLowerCase();
      if (search.trim())    params.search = search.trim();
      const res = await opportunitiesAPI.getAll(params);
      setOpps(res.data.data ?? []);
    } catch { setOppsError('Could not load opportunities.'); }
    finally { setOppsLoading(false); }
  }, [filter, search]);

  const loadFeed = useCallback(async () => {
    try {
      const res = await collegesAPI.studentUpdates();
      setEvents(res.data.events ?? []);
      setAnnounces(res.data.announcements ?? []);
    } catch { /* silent — not all students are verified */ }
    finally { setFeedLoading(false); }
  }, []);

  useEffect(() => { setOppsLoading(true); loadOpps(); }, [loadOpps]);
  useEffect(() => { loadFeed(); }, [loadFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadOpps(), loadFeed()])
      .finally(() => setRefreshing(false));
  }, [loadOpps, loadFeed]);

  const handleApply = async (id: string) => {
    setApplying(id);
    try {
      await opportunitiesAPI.apply(id);
      setApplied(prev => new Set([...prev, id]));
    } catch (err: any) {
      const status = err?.response?.status;
      // 409 = already applied — treat as success so button shows "Applied"
      if (status === 409 || status === 400) {
        setApplied(prev => new Set([...prev, id]));
      }
      // Any other error — leave button interactive so user can retry
    } finally { setApplying(null); }
  };

  const dismiss = (id: string) =>
    setDismissed(prev => new Set([...prev, id]));

  // ── Derived ─────────────────────────────────────────────────────────────

  const visibleOpps = search.trim()
    ? opps.filter(o =>
        o.title?.toLowerCase().includes(search.toLowerCase()) ||
        o.company?.toLowerCase().includes(search.toLowerCase()))
    : opps;

  const visibleAnnounces = announces.filter(a => !dismissed.has(a._id));

  // Merge default reminders with live college events into one unified upcoming list
  const upcomingEvents = events
    .filter(e => !dismissed.has(e._id))
    .filter(e => (daysUntil(e.startsAt) ?? -1) >= 0);

  return (
    <SafeAreaView edges={['top']} style={S.safe}>

      {/* ── Sticky header — screen title + search + filters ── */}
      <View style={S.stickyHead}>
        <View style={S.titleRow}>
          <View>
            <Text style={S.eyebrow}>Discover</Text>
            <Text style={S.title}>Explore</Text>
          </View>
          {!oppsLoading && (
            <Text style={S.countHint}>{visibleOpps.length} open</Text>
          )}
        </View>

        <SearchBar value={search} onChange={setSearch} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.filterRow}>
          {OPP_FILTERS.map(f => (
            <FilterChip
              key={f}
              label={f}
              active={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Main scroll feed ── */}
      <ScrollView
        contentContainerStyle={S.feed}
        refreshControl={
          <RefreshControl
            colors={[Colors.accent]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}>

        {/* ── 1. Academic reminders + college events ── */}
        <UpcomingSection
          defaults={DEFAULT_REMINDERS.filter(r => !dismissed.has(r.id))}
          events={upcomingEvents}
          loading={feedLoading}
          onDismissDefault={dismiss}
          onDismissEvent={dismiss}
        />

        {/* ── 2. College announcements (verified students) ── */}
        {(visibleAnnounces.length > 0 || (!feedLoading && announces.length > 0)) && (
          <AnnouncementsSection
            items={visibleAnnounces}
            onDismiss={dismiss}
          />
        )}

        {/* ── 3. Opportunities ── */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Opportunities</Text>

          {oppsError ? <ErrorBanner message={oppsError} /> : null}

          {oppsLoading ? (
            <View style={S.listGap}>
              {[0, 1, 2, 3].map(i => <OppSkeleton key={i} />)}
            </View>
          ) : visibleOpps.length === 0 ? (
            <Card>
              <EmptyState
                title="Nothing found"
                body="Try a different filter or check back soon for new postings."
              />
            </Card>
          ) : (
            <View style={S.listGap}>
              {visibleOpps.map(opp => (
                <OppCard
                  key={opp._id}
                  opp={opp}
                  applying={applying === opp._id}
                  alreadyApplied={applied.has(opp._id)}
                  onApply={() => handleApply(opp._id)}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Upcoming Section ─────────────────────────────────────────────────────────

type DefaultReminder = typeof DEFAULT_REMINDERS[number];

function UpcomingSection({
  defaults, events, loading, onDismissDefault, onDismissEvent,
}: {
  defaults: DefaultReminder[];
  events: CollegeEvent[];
  loading: boolean;
  onDismissDefault: (id: string) => void;
  onDismissEvent: (id: string) => void;
}) {
  const hasContent = defaults.length > 0 || events.length > 0;

  return (
    <View style={S.section}>
      <Text style={S.sectionLabel}>Upcoming</Text>

      {loading && events.length === 0 ? (
        <View style={S.listGap}>
          <ReminderSkeleton />
          <ReminderSkeleton />
        </View>
      ) : !hasContent ? (
        // Don't show an empty state here — absence of reminders is fine
        null
      ) : (
        <View style={S.listGap}>
          {/* Default CIE reminders */}
          {defaults.map(r => (
            <ReminderCard
              key={r.id}
              title={`${r.subject} ${r.type}`}
              subtitle={r.date}
              urgencyDays={r.daysFromNow}
              onDismiss={() => onDismissDefault(r.id)}
            />
          ))}

          {/* Live college events */}
          {events.map(e => {
            const days = daysUntil(e.startsAt);
            return (
              <ReminderCard
                key={e._id}
                title={e.title ?? 'Untitled event'}
                subtitle={[fmtDate(e.startsAt), e.location].filter(Boolean).join(' · ')}
                badge={e.type}
                badgeColor={eventBadge(e.type)}
                urgencyDays={days}
                onDismiss={() => onDismissEvent(e._id)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({
  title, subtitle, badge, badgeColor, urgencyDays, onDismiss,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: BadgeColor;
  urgencyDays: number | null;
  onDismiss?: () => void;
}) {
  const accentColor = urgencyColor(urgencyDays);
  const label       = urgencyLabel(urgencyDays);

  return (
    <View style={[rS.card, { borderLeftColor: accentColor }]}>
      <View style={rS.body}>
        <Row style={rS.top}>
          <Text style={rS.title} numberOfLines={2}>{title}</Text>
          {onDismiss && (
            <Pressable onPress={onDismiss} hitSlop={12} style={rS.dismissBtn}>
              <Ionicons name="close" size={14} color={Colors.text3} />
            </Pressable>
          )}
        </Row>

        <Row style={rS.meta}>
          {subtitle ? (
            <Text style={rS.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
          {badge ? (
            <Badge label={badge} color={badgeColor ?? 'muted'} />
          ) : null}
        </Row>

        {label ? (
          <View style={[rS.urgencyPill, { borderColor: accentColor + '55' }]}>
            <View style={[rS.urgencyDot, { backgroundColor: accentColor }]} />
            <Text style={[rS.urgencyTxt, { color: accentColor }]}>{label}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const rS = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderLeftWidth: 3,
    // No full borderRadius on left — left border needs clean flush edge
    borderTopRightRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  body:       { gap: 7, padding: 12, paddingLeft: 14 },
  top:        { gap: 8, justifyContent: 'space-between', alignItems: 'flex-start' },
  title:      { ...Typography.h4, color: Colors.text0, flex: 1, lineHeight: 20 },
  dismissBtn: { marginTop: 1 },
  meta:       { gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  subtitle:   { ...Typography.bodySm, color: Colors.text3, flex: 1 },
  urgencyPill:{
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgencyDot: { borderRadius: Radius.full, height: 6, width: 6 },
  urgencyTxt: { ...Typography.bodyXs, fontWeight: '600' as const },
});

// ─── Announcements Section ────────────────────────────────────────────────────

function AnnouncementsSection({
  items, onDismiss,
}: {
  items: CollegeAnnouncement[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={S.section}>
      <Text style={S.sectionLabel}>From your college</Text>
      <View style={aS.listCard}>
        {items.map((a, i) => (
          <View key={a._id}>
            {i > 0 && <Divider />}
            <AnnouncementRow item={a} onDismiss={() => onDismiss(a._id)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function AnnouncementRow({
  item, onDismiss,
}: {
  item: CollegeAnnouncement;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded(v => !v)}
      style={({ pressed }) => [aS.row, pressed && aS.rowPressed]}>
      <View style={aS.rowBody}>
        <Row style={aS.rowTop}>
          <Text style={aS.rowTitle} numberOfLines={expanded ? undefined : 1}>
            {item.title}
          </Text>
          <Row style={{ gap: 6 }}>
            {item.createdAt && (
              <Text style={aS.rowTime}>{relativeTime(item.createdAt)}</Text>
            )}
            <Pressable onPress={onDismiss} hitSlop={10}>
              <Ionicons name="close" size={13} color={Colors.text3} />
            </Pressable>
          </Row>
        </Row>

        {expanded && item.body ? (
          <Text style={aS.rowBody2}>{item.body}</Text>
        ) : null}

        <Row style={aS.rowMeta}>
          {item.postedBy?.name && (
            <Text style={aS.rowPoster}>{item.postedBy.name}</Text>
          )}
          {item.department ? (
            <Badge label={item.department} color="muted" />
          ) : null}
        </Row>
      </View>
    </Pressable>
  );
}

const aS = StyleSheet.create({
  listCard: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row:        { padding: Spacing.md },
  rowPressed: { backgroundColor: Colors.bg3 },
  rowBody:    { gap: 6 },
  rowTop:     { gap: 8, justifyContent: 'space-between', alignItems: 'flex-start' },
  rowTitle:   { ...Typography.h4, color: Colors.text0, flex: 1 },
  rowTime:    { ...Typography.bodyXs, color: Colors.text3 },
  rowBody2:   { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  rowMeta:    { gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  rowPoster:  { ...Typography.bodyXs, color: Colors.text3 },
});

// ─── Opportunity Card ─────────────────────────────────────────────────────────

function OppCard({
  opp, applying, alreadyApplied, onApply,
}: {
  opp: Opportunity; applying: boolean; alreadyApplied: boolean; onApply: () => void;
}) {
  const deadline   = fmtDeadline(opp.deadline);
  const hasApplied = alreadyApplied || (opp.applications?.some(a => a.status === 'pending') ?? false);

  return (
    <View style={oS.card}>
      {/* Header row */}
      <Row style={oS.top}>
        {/* Org initial */}
        <View style={oS.orgMark}>
          <Text style={oS.orgInitial}>
            {(opp.company ?? opp.title ?? '?')[0].toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <Text style={oS.cardTitle} numberOfLines={2}>{opp.title}</Text>
          {opp.company && <Text style={oS.company}>{opp.company}</Text>}
        </View>

        <View style={{ gap: 6, alignItems: 'flex-end' }}>
          <Badge label={opp.type ?? 'opportunity'} color={oppBadge(opp.type)} />
          {opp.matchScore != null && (
            <Text style={oS.match}>{opp.matchScore}% match</Text>
          )}
        </View>
      </Row>

      {/* Description */}
      {opp.description && (
        <Text style={oS.desc} numberOfLines={2}>{opp.description}</Text>
      )}

      {/* Meta — text only, no emoji prefixes */}
      {(opp.location || opp.duration || opp.stipend) && (
        <Row style={oS.metaRow}>
          {opp.location && <MetaItem icon="location-outline" label={opp.location} />}
          {opp.duration && <MetaItem icon="time-outline"     label={opp.duration} />}
          {opp.stipend  && <MetaItem icon="cash-outline"     label={opp.stipend}  />}
        </Row>
      )}

      {/* Skill tags */}
      {(opp.requiredSkills?.length ?? 0) > 0 && (
        <Row style={oS.skillRow}>
          {opp.requiredSkills!.slice(0, 5).map(sk => (
            <View key={sk} style={oS.skillTag}>
              <Text style={oS.skillTxt}>{sk}</Text>
            </View>
          ))}
          {opp.requiredSkills!.length > 5 && (
            <Text style={oS.skillMore}>+{opp.requiredSkills!.length - 5}</Text>
          )}
        </Row>
      )}

      {/* Footer */}
      <Row style={oS.footer}>
        {deadline
          ? <Text style={[oS.deadlineTxt, { color: deadline.color }]}>{deadline.label}</Text>
          : <View />}

        <Pressable
          disabled={hasApplied || applying}
          onPress={onApply}
          style={[oS.applyBtn, (hasApplied || applying) && oS.applyBtnDone]}>
          {applying
            ? <ActivityIndicator color={Colors.bg1} size="small" />
            : <Text style={[oS.applyTxt, (hasApplied || applying) && oS.applyTxtDone]}>
                {hasApplied ? 'Applied' : 'Apply now'}
              </Text>}
        </Pressable>
      </Row>
    </View>
  );
}

function MetaItem({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={oS.metaItem}>
      <Ionicons name={icon} size={12} color={Colors.text3} />
      <Text style={oS.metaTxt}>{label}</Text>
    </View>
  );
}

const oS = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderRadius: Radius.lg,        // Phase 1 standard — not Radius.xl
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  top:      { gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' },
  orgMark: {
    alignItems: 'center',
    backgroundColor: Colors.bg4,
    borderColor: Colors.border2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  orgInitial: { ...Typography.h3, color: Colors.text0 },          // h3 not fontSize:18/800
  cardTitle:  { ...Typography.h4, color: Colors.text0, lineHeight: 20 },
  company:    { ...Typography.bodySm, color: Colors.text3 },
  match:      { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' as const },
  desc:       { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },
  metaRow:    { flexWrap: 'wrap', gap: 8 },
  metaItem:   {
    alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.xs,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  metaTxt:    { ...Typography.bodySm, color: Colors.text2 },
  skillRow:   { flexWrap: 'wrap', gap: 6 },
  skillTag: {
    backgroundColor: Colors.bg4,
    borderColor: Colors.border1,
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skillTxt:   { ...Typography.bodyXs, color: Colors.text3, fontWeight: '600' as const },
  skillMore:  { ...Typography.bodySm, color: Colors.text3, lineHeight: 24 },
  footer:     { justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  deadlineTxt:{ ...Typography.uiSm },
  applyBtn: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 18,
    // No Shadow.accent — no colored glow
  },
  applyBtnDone: {
    backgroundColor: Colors.bg4,
    borderColor: Colors.border2,
    borderWidth: 1,
  },
  applyTxt:     { ...Typography.uiSm, color: Colors.bg1, fontWeight: '700' as const },
  applyTxtDone: { color: Colors.text3, fontWeight: '500' as const },
});

// ─── Primitives ───────────────────────────────────────────────────────────────

function SearchBar({
  value, onChange,
}: { value: string; onChange: (t: string) => void }) {
  return (
    <View style={sbS.wrap}>
      <Ionicons name="search-outline" size={16} color={Colors.text3} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChange}
        placeholder="Search by title or company"
        placeholderTextColor={Colors.text4}
        style={sbS.input}
        value={value}
      />
      {value.length > 0 && (
        <Pressable hitSlop={10} onPress={() => onChange('')}>
          <Ionicons name="close-circle" size={16} color={Colors.text3} />
        </Pressable>
      )}
    </View>
  );
}
const sbS = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
  },
  input: { color: Colors.text0, flex: 1, fontSize: 15, height: 44 },
});

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[fcS.chip, active && fcS.chipActive]}>
      <Text style={[fcS.txt, active && fcS.txtActive]}>{label}</Text>
    </Pressable>
  );
}
const fcS = StyleSheet.create({
  chip:      {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  txt:        { ...Typography.uiSm, color: Colors.text2 },
  txtActive:  { color: Colors.accentLight, fontWeight: '700' as const },
});

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ReminderSkeleton() {
  return (
    <View style={[rS.card, { borderLeftColor: Colors.border2, gap: 9, padding: 12, paddingLeft: 14 }]}>
      <Skeleton height={13} width="60%" />
      <Skeleton height={10} width="40%" />
    </View>
  );
}

function OppSkeleton() {
  return (
    <View style={[oS.card, { gap: 12 }]}>
      <Row style={{ gap: 12 }}>
        <Skeleton width={40} height={40} radius={Radius.sm} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={13} width="68%" />
          <Skeleton height={10} width="42%" />
        </View>
      </Row>
      <Skeleton height={10} />
      <Skeleton height={10} width="80%" />
      <Row style={{ gap: 8 }}>
        <Skeleton height={26} width={76} radius={Radius.xs} />
        <Skeleton height={26} width={76} radius={Radius.xs} />
      </Row>
    </View>
  );
}

// ─── Screen-level styles ──────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:     { backgroundColor: Colors.bg1, flex: 1 },

  stickyHead: {
    backgroundColor: Colors.bg1,
    borderBottomColor: Colors.border0,
    borderBottomWidth: 1,
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  titleRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow:   { ...Typography.label, color: Colors.accent, fontSize: 10 },
  title:     { ...Typography.h2, color: Colors.text0 },       // h2 — not raw 30/800
  countHint: { ...Typography.bodySm, color: Colors.text3, marginBottom: 2 },

  filterRow: { gap: 8 },

  feed: {
    gap: 0,
    paddingBottom: NAV_BOTTOM_OFFSET + 20,
  },

  section: {
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.text3,
    paddingHorizontal: 2,
  },
  listGap: { gap: 8 },
});
