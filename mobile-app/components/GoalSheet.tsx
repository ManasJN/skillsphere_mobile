/**
 * GoalSheet — create / edit goal modal.
 *
 * A single form handles both create and edit.
 * Presented as a bottom sheet over the Goals tab.
 *
 * Fields exposed:
 *   - title (required)
 *   - deadline (required, date picker via text input ISO)
 *   - priority
 *   - type  (monthly / semester / yearly / custom)
 *   - category
 *   - description (optional)
 *   - targetValue + unit (optional — enables numeric progress bar)
 *   - milestones (addable list, up to 10)
 *
 * Design: restrained, form-focused, no decorative elements.
 * Feels like a Notion / Todoist task creation screen.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { Divider, ErrorBanner, Row } from '@/components/ui';
import { type Goal, type GoalDraft, XP_REWARDS } from '@/hooks/useGoals';

// ─── Option sets (mirrors server enums) ──────────────────────────────────────

const PRIORITIES = [
  { value: 'low'    as const, label: 'Low' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'high'   as const, label: 'High' },
] as const;

const TYPES = [
  { value: 'monthly'  as const, label: 'Monthly' },
  { value: 'semester' as const, label: 'Semester' },
  { value: 'yearly'   as const, label: 'Yearly' },
  { value: 'custom'   as const, label: 'Custom' },
] as const;

const CATEGORIES = [
  'Coding', 'Academic', 'Project', 'Skill', 'Career', 'Health', 'Other',
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

type GoalSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (draft: GoalDraft) => Promise<void>;
  /** Pass a goal to edit it; omit to create a new one */
  goal?: Goal | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function GoalSheet({ visible, onClose, onSave, goal }: GoalSheetProps) {
  const isEdit = !!goal;

  // Form state
  const [title,       setTitle]      = useState('');
  const [description, setDesc]       = useState('');
  const [deadline,    setDeadline]   = useState('');
  const [priority,    setPriority]   = useState<Goal['priority']>('medium');
  const [type,        setType]       = useState<Goal['type']>('semester');
  const [category,    setCategory]   = useState<Goal['category']>('Other');
  const [targetValue, setTargetVal]  = useState('');
  const [unit,        setUnit]       = useState('');
  const [milestones,  setMilestones] = useState<string[]>(['']);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const titleRef = useRef<TextInput>(null);

  // Populate form when editing
  useEffect(() => {
    if (visible) {
      if (goal) {
        setTitle(goal.title);
        setDesc(goal.description ?? '');
        setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : '');
        setPriority(goal.priority);
        setType(goal.type);
        setCategory(goal.category);
        setTargetVal(goal.targetValue ? String(goal.targetValue) : '');
        setUnit(goal.unit ?? '');
        setMilestones(
          goal.milestones.length > 0
            ? goal.milestones.map(m => m.title)
            : ['']
        );
      } else {
        // Reset for new goal
        setTitle('');
        setDesc('');
        setDeadline('');
        setPriority('medium');
        setType('semester');
        setCategory('Other');
        setTargetVal('');
        setUnit('');
        setMilestones(['']);
      }
      setError('');
      setSaving(false);
    }
  }, [visible, goal]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) { setError('Goal title is required.'); return; }
    if (!deadline)     { setError('Please set a deadline.'); return; }

    // Basic date validation
    const d = new Date(deadline);
    if (isNaN(d.getTime())) { setError('Enter a valid date (YYYY-MM-DD).'); return; }

    const cleanMilestones = milestones
      .map(m => m.trim())
      .filter(Boolean)
      .map(title => ({ title }));

    const draft: GoalDraft = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      deadline: d.toISOString(),
      priority,
      type,
      category,
      targetValue: targetValue ? Number(targetValue) : undefined,
      unit: unit.trim() || undefined,
      milestones: cleanMilestones.length > 0 ? cleanMilestones : undefined,
      xpReward: XP_REWARDS[type],
    };

    setSaving(true);
    setError('');
    try {
      await onSave(draft);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not save goal.');
    } finally {
      setSaving(false);
    }
  };

  const addMilestone = () => {
    if (milestones.length >= 10) return;
    setMilestones(prev => [...prev, '']);
  };

  const updateMilestone = (i: number, val: string) => {
    setMilestones(prev => prev.map((m, idx) => idx === i ? val : m));
  };

  const removeMilestone = (i: number) => {
    setMilestones(prev => prev.filter((_, idx) => idx !== i));
  };

  const xpHint = XP_REWARDS[type];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      statusBarTranslucent={true}
      transparent={false}
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={S.root}>

        {/* ── Sheet header ── */}
        <View style={S.header}>
          <Pressable onPress={onClose} hitSlop={12} style={S.headerBtn}>
            <Ionicons name="close" size={20} color={Colors.text2} />
          </Pressable>
          <Text style={S.headerTitle}>{isEdit ? 'Edit goal' : 'New goal'}</Text>
          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={[S.saveBtn, saving && S.saveBtnOff]}>
            {saving
              ? <ActivityIndicator size="small" color={Colors.bg1} />
              : <Text style={S.saveTxt}>Save</Text>}
          </Pressable>
        </View>

        <Divider />

        <ScrollView
          contentContainerStyle={S.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {error ? <ErrorBanner message={error} /> : null}

          {/* ── Title ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Goal title <Text style={S.required}>*</Text></Text>
            <TextInput
              autoCapitalize="sentences"
              autoCorrect={false}
              autoFocus={!isEdit}
              maxLength={200}
              onChangeText={setTitle}
              placeholder="What do you want to achieve?"
              placeholderTextColor={Colors.text4}
              ref={titleRef}
              style={S.textInput}
              value={title}
            />
          </View>

          {/* ── Deadline ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Deadline <Text style={S.required}>*</Text></Text>
            <TextInput
              keyboardType="numeric"
              maxLength={10}
              onChangeText={setDeadline}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.text4}
              style={S.textInput}
              value={deadline}
            />
          </View>

          {/* ── Type + XP hint ── */}
          <View style={S.field}>
            <Row style={S.fieldLabelRow}>
              <Text style={S.fieldLabel}>Timeframe</Text>
              <Text style={S.xpHint}>+{xpHint} XP on completion</Text>
            </Row>
            <Row style={S.segRow}>
              {TYPES.map(t => (
                <Pressable
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={[S.seg, type === t.value && S.segActive]}>
                  <Text style={[S.segTxt, type === t.value && S.segTxtActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </Row>
          </View>

          {/* ── Priority ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Priority</Text>
            <Row style={S.segRow}>
              {PRIORITIES.map(p => (
                <Pressable
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[S.seg, priority === p.value && S.segActive,
                    priority === p.value && priorityActiveBg[p.value]]}>
                  <Text style={[S.segTxt, priority === p.value && priorityActiveFg[p.value]]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </Row>
          </View>

          {/* ── Category ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Category</Text>
            <View style={S.catGrid}>
              {CATEGORIES.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[S.catChip, category === c && S.catChipActive]}>
                  <Text style={[S.catTxt, category === c && S.catTxtActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Description ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Description <Text style={S.optional}>(optional)</Text></Text>
            <TextInput
              autoCapitalize="sentences"
              maxLength={500}
              multiline
              numberOfLines={3}
              onChangeText={setDesc}
              placeholder="What does success look like?"
              placeholderTextColor={Colors.text4}
              style={[S.textInput, S.textArea]}
              textAlignVertical="top"
              value={description}
            />
          </View>

          {/* ── Numeric tracking ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>
              Numeric target <Text style={S.optional}>(optional)</Text>
            </Text>
            <Text style={S.fieldHint}>
              Enables automatic progress calculation from a number you track
            </Text>
            <Row style={{ gap: 10 }}>
              <TextInput
                keyboardType="numeric"
                maxLength={6}
                onChangeText={setTargetVal}
                placeholder="100"
                placeholderTextColor={Colors.text4}
                style={[S.textInput, { flex: 1 }]}
                value={targetValue}
              />
              <TextInput
                autoCapitalize="none"
                maxLength={20}
                onChangeText={setUnit}
                placeholder="problems / commits"
                placeholderTextColor={Colors.text4}
                style={[S.textInput, { flex: 2 }]}
                value={unit}
              />
            </Row>
          </View>

          {/* ── Milestones ── */}
          <View style={S.field}>
            <Row style={S.fieldLabelRow}>
              <Text style={S.fieldLabel}>Milestones <Text style={S.optional}>(optional)</Text></Text>
              <Text style={S.fieldHint}>{milestones.filter(Boolean).length} / 10</Text>
            </Row>
            <View style={S.milestoneList}>
              {milestones.map((m, i) => (
                <Row key={i} style={S.milestoneRow}>
                  <TextInput
                    autoCapitalize="sentences"
                    maxLength={100}
                    onChangeText={v => updateMilestone(i, v)}
                    placeholder={`Step ${i + 1}`}
                    placeholderTextColor={Colors.text4}
                    style={[S.textInput, S.milestoneInput]}
                    value={m}
                  />
                  {milestones.length > 1 && (
                    <Pressable onPress={() => removeMilestone(i)} hitSlop={10}>
                      <Ionicons name="remove-circle-outline" size={18} color={Colors.text3} />
                    </Pressable>
                  )}
                </Row>
              ))}
            </View>
            {milestones.length < 10 && (
              <Pressable onPress={addMilestone} style={S.addMilestoneBtn}>
                <Ionicons name="add" size={15} color={Colors.accent} />
                <Text style={S.addMilestoneTxt}>Add step</Text>
              </Pressable>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Priority color overrides for selected segments ──────────────────────────

const priorityActiveBg: Record<Goal['priority'], object> = {
  high:   { backgroundColor: Colors.status.dangerBg, borderColor: Colors.status.dangerBorder },
  medium: { backgroundColor: Colors.status.warningBg, borderColor: Colors.status.warningBorder },
  low:    { backgroundColor: Colors.status.successBg, borderColor: Colors.status.successBorder },
};
const priorityActiveFg: Record<Goal['priority'], object> = {
  high:   { color: Colors.danger },
  medium: { color: Colors.warning },
  low:    { color: Colors.success },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { backgroundColor: Colors.bg1, flex: 1 },

  // Header
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 54,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  headerBtn:   { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.text0 },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 16,
    minWidth: 64,
  },
  saveBtnOff: { opacity: 0.5 },
  saveTxt:    { ...Typography.uiSm, color: Colors.bg1, fontWeight: '700' as const },

  // Body
  body: {
    gap: Spacing.xl,
    paddingBottom: 40,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Field
  field:        { gap: 8 },
  fieldLabel:   { ...Typography.uiSm, color: Colors.text1, fontWeight: '600' as const },
  fieldLabelRow:{ justifyContent: 'space-between' },
  fieldHint:    { ...Typography.bodyXs, color: Colors.text3 },
  required:     { color: Colors.danger },
  optional:     { color: Colors.text3, fontWeight: '400' as const },

  // Text inputs — same style throughout the form
  textInput: {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.text0,
    fontSize: 15,
    height: 48,
    paddingHorizontal: 14,
  },
  textArea: {
    height: undefined,
    minHeight: 80,
    paddingTop: 13,
  },

  // Segment row (type, priority)
  segRow: { gap: 6, flexWrap: 'wrap' },
  seg: {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  segActive:    { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  segTxt:       { ...Typography.uiSm, color: Colors.text2 },
  segTxtActive: { color: Colors.accentLight, fontWeight: '600' as const },

  // Category grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  catChip: {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  catChipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  catTxt:        { ...Typography.bodySm, color: Colors.text2 },
  catTxtActive:  { color: Colors.accentLight, fontWeight: '600' as const },

  // Milestones
  milestoneList: { gap: 8 },
  milestoneRow:  { gap: 10, alignItems: 'center' },
  milestoneInput:{ flex: 1, height: 44 },
  addMilestoneBtn: {
    alignItems: 'center',
    borderColor: Colors.border1,
    borderRadius: Radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  addMilestoneTxt: { ...Typography.uiSm, color: Colors.accent },

  // XP hint
  xpHint: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' as const },
});
