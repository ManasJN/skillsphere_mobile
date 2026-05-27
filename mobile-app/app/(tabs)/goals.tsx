/**
 * Goals tab — primary goal management surface.
 *
 * Layout:
 *   - Sticky header: screen title + summary stats + "New goal" button
 *   - Status filter bar: All / Active / Completed / Paused
 *   - Goal cards: grouped by priority within the selected filter
 *   - FAB-equivalent: "New goal" in the header (not a floating button — cleaner)
 *
 * Design rules:
 *   - No gaming UI — this is a productivity screen
 *   - XP rewards shown inline as a quiet hint, not a loud badge
 *   - Priority via left-border color (same system as reminders in Explore)
 *   - Milestone list inside each expanded card
 *   - Swipe to complete / delete handled via long-press action row
 *   - No confetti, no level-up animations, no achievement modals
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, NAV_BOTTOM_OFFSET, Radius, Spacing, Typography } from '@/lib/theme';
import {
  Badge, BadgeColor, Divider, EmptyState, ErrorBanner, FadeView,
  ProgressBar, Row, Skeleton,
} from '@/components/ui';
import { GoalSheet } from '@/components/GoalSheet';
import { type Goal, type GoalDraft, useGoals } from '@/hooks/useGoals';
import { useFadeSlideIn, usePressScale } from '@/hooks/useAnimations';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'active' | 'completed' | 'all';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function priorityColor(p: Goal['priority']): string {
  return { high: Colors.danger, medium: Colors.warning, low: Colors.success }[p];
}

function priorityOrder(p: Goal['priority']): number {
  return { high: 0, medium: 1, low: 2 }[p];
}

function statusBadge(s: Goal['status']): BadgeColor {
  return ({ active: 'teal', completed: 'green', paused: 'muted', abandoned: 'red' } as const)[s] ?? 'muted';
}

function fmtDate(d?: string): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(d));
}

function daysUntil(d?: string): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function deadlineLabel(d?: string): { text: string; color: string } | null {
  const days = daysUntil(d);
  if (days === null)  return null;
  if (days < 0)       return { text: 'Overdue',       color: Colors.danger };
  if (days === 0)     return { text: 'Due today',      color: Colors.danger };
  if (days === 1)     return { text: 'Due tomorrow',   color: Colors.warning };
  if (days <= 7)      return { text: `${days}d left`,  color: Colors.warning };
  return               { text: `Due ${fmtDate(d)}`,    color: Colors.text3 };
}

const TYPE_LABELS: Record<Goal['type'], string> = {
  monthly: 'Monthly', semester: 'Semester', yearly: 'Yearly', custom: 'Custom',
};

const CATEGORY_COLORS: Partial<Record<Goal['category'], string>> = {
  Coding:   Colors.accent,
  Academic: '#9B8FD4',
  Project:  '#52B788',
  Career:   '#D4A853',
  Health:   '#68C98A',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [refreshing,   setRefreshing]   = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingGoal,  setEditingGoal]  = useState<Goal | null>(null);

  const { goals, loading, error, refetch, create, update, complete, remove, toggleMilestone, stats } =
    useGoals(statusFilter === 'all' ? 'all' : statusFilter);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }, [refetch]);

  const handleSave = async (draft: GoalDraft) => {
    if (editingGoal) {
      await update(editingGoal._id, draft);
    } else {
      await create(draft);
    }
  };

  const openCreate = () => {
    setEditingGoal(null);
    setSheetVisible(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setSheetVisible(true);
  };

  const handleComplete = (goal: Goal) => {
    Alert.alert(
      'Mark as complete',
      `"${goal.title}"\n\nYou'll earn +${goal.xpReward} XP.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => complete(goal._id).catch(() =>
            Alert.alert('Error', 'Could not complete goal. Try again.')
          ),
        },
      ]
    );
  };

  const handleDelete = (goal: Goal) => {
    Alert.alert(
      'Delete goal',
      `"${goal.title}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => remove(goal._id).catch(() =>
            Alert.alert('Error', 'Could not delete goal. Try again.')
          ),
        },
      ]
    );
  };

  // Sort by priority within current filter
  const sorted = [...goals].sort(
    (a, b) => priorityOrder(a.priority) - priorityOrder(b.priority)
  );

  return (
    <SafeAreaView edges={['top']} style={S.safe}>

      {/* ── Sticky header ── */}
      <View style={S.stickyHead}>
        <GoalsHeaderAnimated onNew={openCreate} loading={loading} stats={stats} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      </View>

      {/* ── List ── */}
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

        {error ? <ErrorBanner message={error} /> : null}

        {loading ? (
          <View style={S.listGap}>
            {[0, 1, 2, 3].map(i => <GoalCardSkeleton key={i} />)}
          </View>
        ) : sorted.length === 0 ? (
          <View style={S.emptyWrap}>
            {statusFilter === 'completed' ? (
              <EmptyState
                title="No completed goals yet"
                body="Mark active goals as complete to see them here."
              />
            ) : statusFilter === 'active' ? (
              <View style={S.emptyAction}>
                <EmptyState
                  title="No active goals"
                  body="Goals help you stay on track with deadlines and progress bars."
                />
                <Pressable onPress={openCreate} style={S.emptyBtn}>
                  <Text style={S.emptyBtnTxt}>Create your first goal</Text>
                </Pressable>
              </View>
            ) : (
              <EmptyState
                title="No goals found"
                body="Create a goal using the button above to get started."
              />
            )}
          </View>
        ) : (
          <FadeView delay={50}>
            <View style={S.listGap}>
              {sorted.map(goal => (
                <GoalCard
                  key={goal._id}
                  goal={goal}
                  onEdit={() => openEdit(goal)}
                  onComplete={() => handleComplete(goal)}
                  onDelete={() => handleDelete(goal)}
                  onToggleMilestone={(mId) => toggleMilestone(goal._id, mId)}
                />
              ))}
            </View>
          </FadeView>
        )}
      </ScrollView>

      {/* ── Create / edit sheet ── */}
      <GoalSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditingGoal(null); }}
        onSave={handleSave}
        goal={editingGoal}
      />
    </SafeAreaView>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

type GoalCardProps = {
  goal: Goal;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onToggleMilestone: (milestoneId: string) => void;
};

function GoalCard({ goal, onEdit, onComplete, onDelete, onToggleMilestone }: GoalCardProps) {
  const [expanded,    setExpanded]   = useState(false);
  const [showActions, setShowActions]= useState(false);
  const { scale, onPressIn, onPressOut } = usePressScale(0.985);

  const dl       = deadlineLabel(goal.deadline);
  const pColor   = priorityColor(goal.priority);
  const catColor = CATEGORY_COLORS[goal.category] ?? Colors.text3;
  const isDone   = goal.status === 'completed';

  return (
    <Pressable
      onPress={() => { setExpanded(v => !v); setShowActions(false); }}
      onLongPress={() => setShowActions(v => !v)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <Animated.View style={[
        gS.card,
        { borderLeftColor: isDone ? Colors.success : pColor },
        { transform: [{ scale }] },
      ]}>

      {/* ── Main row ── */}
      <View style={gS.body}>
        {/* Title + badges */}
        <Row style={gS.topRow}>
          <View style={gS.titleBlock}>
            <Text style={[gS.title, isDone && gS.titleDone]} numberOfLines={expanded ? undefined : 2}>
              {goal.title}
            </Text>
            <Row style={gS.metaRow}>
              <View style={[gS.catDot, { backgroundColor: catColor }]} />
              <Text style={gS.catLabel}>{goal.category}</Text>
              <Text style={gS.dot}>·</Text>
              <Text style={gS.typeLabel}>{TYPE_LABELS[goal.type]}</Text>
            </Row>
          </View>
          <View style={gS.rightCol}>
            <Badge label={goal.status} color={statusBadge(goal.status)} />
            {!isDone && (
              <Text style={[gS.xpHint]}>+{goal.xpReward} XP</Text>
            )}
          </View>
        </Row>

        {/* Progress */}
        {!isDone && (
          <View style={gS.progressBlock}>
            <Row style={gS.progressMeta}>
              <Text style={gS.progressPct}>{goal.progress}%</Text>
              {goal.targetValue && goal.unit && (
                <Text style={gS.progressTarget}>
                  {goal.currentValue ?? 0} / {goal.targetValue} {goal.unit}
                </Text>
              )}
              {dl && (
                <Text style={[gS.deadline, { color: dl.color }]}>{dl.text}</Text>
              )}
            </Row>
            <ProgressBar
              pct={goal.progress}
              color={pColor}
              height={4}
            />
          </View>
        )}

        {isDone && goal.completedAt && (
          <Text style={gS.completedOn}>
            Completed {fmtDate(goal.completedAt)}
          </Text>
        )}

        {/* Description — only when expanded */}
        {expanded && goal.description ? (
          <Text style={gS.desc}>{goal.description}</Text>
        ) : null}

        {/* Milestones — only when expanded */}
        {expanded && goal.milestones.length > 0 && (
          <View style={gS.milestones}>
            <Text style={gS.milestonesLabel}>
              Steps · {goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length}
            </Text>
            {goal.milestones.map(m => (
              <Pressable
                key={m._id}
                onPress={() => !isDone && onToggleMilestone(m._id)}
                style={gS.milestone}>
                <View style={[gS.mCheck, m.isCompleted && gS.mCheckDone]}>
                  {m.isCompleted && (
                    <Ionicons name="checkmark" size={11} color={Colors.bg1} />
                  )}
                </View>
                <Text style={[gS.mTitle, m.isCompleted && gS.mTitleDone]}>
                  {m.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ── Action row (shown on long press) ── */}
      {showActions && (
        <>
          <Divider style={{ marginHorizontal: 14 }} />
          <Row style={gS.actions}>
            <ActionBtn icon="create-outline" label="Edit" onPress={() => { setShowActions(false); onEdit(); }} />
            {!isDone && (
              <ActionBtn icon="checkmark-circle-outline" label="Complete" onPress={() => { setShowActions(false); onComplete(); }} accent />
            )}
            <ActionBtn icon="trash-outline" label="Delete" onPress={() => { setShowActions(false); onDelete(); }} danger />
          </Row>
        </>
      )}
      </Animated.View>
    </Pressable>
  );
}

function ActionBtn({
  icon, label, onPress, accent, danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [gS.actionBtn, pressed && { opacity: 0.7 }]}>
      <Ionicons
        name={icon}
        size={18}
        color={danger ? Colors.danger : accent ? Colors.accent : Colors.text2}
      />
      <Text style={[
        gS.actionLabel,
        danger ? { color: Colors.danger } : accent ? { color: Colors.accent } : null,
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const gS = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderTopRightRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderLeftWidth: 3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPressed:  { opacity: 0.85 },
  body:         { gap: 10, padding: 14, paddingLeft: 14 },

  topRow:      { gap: 10, alignItems: 'flex-start', justifyContent: 'space-between' },
  titleBlock:  { flex: 1, gap: 5 },
  title:       { ...Typography.h4, color: Colors.text0, lineHeight: 20 },
  titleDone:   { color: Colors.text3, textDecorationLine: 'line-through' as const },

  metaRow:     { gap: 5, alignItems: 'center' },
  catDot:      { borderRadius: 3, height: 6, width: 6 },
  catLabel:    { ...Typography.bodyXs, color: Colors.text3, fontWeight: '500' as const },
  typeLabel:   { ...Typography.bodyXs, color: Colors.text3 },
  dot:         { color: Colors.text3, fontSize: 10 },

  rightCol:    { alignItems: 'flex-end', gap: 5 },
  xpHint:     { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' as const },

  progressBlock: { gap: 6 },
  progressMeta:  { justifyContent: 'space-between' },
  progressPct:   { ...Typography.bodyXs, color: Colors.text2, fontWeight: '600' as const },
  progressTarget:{ ...Typography.bodyXs, color: Colors.text3 },
  deadline:      { ...Typography.bodyXs, fontWeight: '600' as const },

  completedOn:   { ...Typography.bodyXs, color: Colors.success },

  desc:    { ...Typography.bodySm, color: Colors.text2, lineHeight: 20 },

  milestones:      { gap: 6 },
  milestonesLabel: { ...Typography.label, color: Colors.text3, fontSize: 10 },
  milestone:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mCheck: {
    alignItems: 'center',
    backgroundColor: Colors.bg4,
    borderColor: Colors.border2,
    borderRadius: 4,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  mCheckDone:  { backgroundColor: Colors.success, borderColor: Colors.success },
  mTitle:      { ...Typography.bodySm, color: Colors.text1, flex: 1 },
  mTitleDone:  { color: Colors.text3, textDecorationLine: 'line-through' as const },

  actions:    { gap: 0, paddingHorizontal: 4, paddingVertical: 6 },
  actionBtn:  { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', padding: 10 },
  actionLabel:{ ...Typography.uiSm, color: Colors.text2 },
});

// ─── Animated Goals Header ────────────────────────────────────────────────────

type GoalsHeaderProps = {
  onNew: () => void;
  loading: boolean;
  stats: { active: number; completed: number; overdue: number };
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
};

function GoalsHeaderAnimated({ onNew, loading, stats, statusFilter, setStatusFilter }: GoalsHeaderProps) {
  const { opacity, translateY } = useFadeSlideIn(0, 6);
  const { scale: btnScale, onPressIn: btnIn, onPressOut: btnOut } = usePressScale(0.95);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Row style={S.titleRow}>
        <View>
          <Text style={S.eyebrow}>Track progress</Text>
          <Text style={S.title}>Goals</Text>
        </View>
        <Pressable onPressIn={btnIn} onPressOut={btnOut} onPress={onNew}>
          <Animated.View style={[S.newBtn, { transform: [{ scale: btnScale }] }]}>
            <Ionicons name="add" size={18} color={Colors.bg1} />
            <Text style={S.newBtnTxt}>New goal</Text>
          </Animated.View>
        </Pressable>
      </Row>

      {!loading && (
        <Row style={S.statsRow}>
          <StatPill label="Active"    value={stats.active}    />
          <StatPill label="Done"      value={stats.completed} accent />
          {stats.overdue > 0 && (
            <StatPill label="Overdue" value={stats.overdue}   danger />
          )}
        </Row>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.filterRow}>
        {(['active', 'completed', 'all'] as StatusFilter[]).map(f => (
          <Pressable
            key={f}
            onPress={() => setStatusFilter(f)}
            style={[S.filterChip, statusFilter === f && S.filterChipActive]}>
            <Text style={[S.filterTxt, statusFilter === f && S.filterTxtActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, accent, danger }: {
  label: string; value: number; accent?: boolean; danger?: boolean;
}) {
  const textColor = danger ? Colors.danger : accent ? Colors.success : Colors.text2;
  const bg        = danger ? Colors.status.dangerBg : accent ? Colors.status.successBg : Colors.bg3;
  const bdr       = danger ? Colors.status.dangerBorder : accent ? Colors.status.successBorder : Colors.border1;
  return (
    <View style={[spS.pill, { backgroundColor: bg, borderColor: bdr }]}>
      <Text style={[spS.val, { color: textColor }]}>{value}</Text>
      <Text style={spS.lbl}>{label}</Text>
    </View>
  );
}
const spS = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  val: { ...Typography.h4, lineHeight: 18 },
  lbl: { ...Typography.bodyXs, color: Colors.text3 },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GoalCardSkeleton() {
  return (
    <View style={[gS.card, { borderLeftColor: Colors.border2, gap: 10, padding: 14, paddingLeft: 14 }]}>
      <Row style={{ gap: 12, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={13} width="70%" />
          <Skeleton height={10} width="40%" />
        </View>
        <Skeleton height={20} width={64} radius={Radius.xs} />
      </Row>
      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Skeleton height={10} width="20%" />
          <Skeleton height={10} width="25%" />
        </Row>
        <Skeleton height={4} radius={Radius.full} />
      </View>
    </View>
  );
}

// ─── Screen styles ────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },

  stickyHead: {
    backgroundColor: Colors.bg1,
    borderBottomColor: Colors.border0,
    borderBottomWidth: 1,
    elevation: 2,
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    zIndex: 10,
  },
  titleRow: { justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow:  { ...Typography.label, color: Colors.accent, fontSize: 10 },
  title:    { ...Typography.h2, color: Colors.text0 },

  newBtn: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 4,
  },
  newBtnTxt: { ...Typography.uiSm, color: Colors.bg1, fontWeight: '700' as const },

  statsRow:  { gap: 8, flexWrap: 'wrap' },
  filterRow: { gap: 8 },
  filterChip: {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  filterTxt:        { ...Typography.uiSm, color: Colors.text2 },
  filterTxtActive:  { color: Colors.accentLight, fontWeight: '700' as const },

  feed: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: NAV_BOTTOM_OFFSET + 20,
    gap: 8,
  },
  listGap: { gap: 8 },
  emptyWrap:    { alignItems: 'center', paddingTop: 60 },
  emptyAction:  { alignItems: 'center', gap: 16 },
  emptyBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  emptyBtnTxt:  { ...Typography.uiSm, color: Colors.bg1, fontWeight: '700' as const },
});
