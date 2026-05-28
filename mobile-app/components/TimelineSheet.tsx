/**
 * components/TimelineSheet.tsx
 *
 * Create / edit timeline entry modal.
 * Follows the GoalSheet pattern exactly — same layout, same form tokens.
 *
 * Fields:
 *   - Category (required)  — segmented picker
 *   - Title (required)     — text input
 *   - Organisation         — optional, "at Company / via Platform"
 *   - Date (required)      — month + year (YYYY-MM format, e.g. "2024-03")
 *   - End Date             — optional, same format
 *   - Description          — optional multiline
 *   - Tags                 — space or comma separated, shown as chips
 *
 * Design: one column, no decorative elements, restrained spacing.
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

import { CATEGORY_CONFIG, CATEGORY_KEYS, type TimelineCategory, type TimelineEntry, type TimelineEntryDraft } from '@/lib/timeline';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { Divider, ErrorBanner, Row } from '@/components/ui';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  visible:  boolean;
  onClose:  () => void;
  onSave:   (draft: TimelineEntryDraft) => Promise<void>;
  /** Pass entry to edit; undefined for create mode */
  entry?:   TimelineEntry | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert YYYY-MM string to display "MMM YYYY" */
function toDisplay(ym: string): string {
  if (!ym || ym.length < 7) return ym;
  const d = new Date(ym + '-01');
  if (isNaN(d.getTime())) return ym;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d);
}

/** Convert YYYY-MM to ISO string midnight */
function toISO(ym: string): string {
  if (!ym) return new Date().toISOString();
  return new Date(ym + '-01T00:00:00.000Z').toISOString();
}

/** Parse ISO → YYYY-MM */
function fromISO(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Parse comma/space separated tag string → array */
function parseTags(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map(t => t.trim())
    .filter(Boolean);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimelineSheet({ visible, onClose, onSave, entry }: Props) {
  const isEditing = !!entry;

  // ── Form state ──
  const [category,     setCategory]     = useState<TimelineCategory>('project');
  const [title,        setTitle]        = useState('');
  const [organisation, setOrganisation] = useState('');
  const [date,         setDate]         = useState('');      // YYYY-MM
  const [endDate,      setEndDate]      = useState('');      // YYYY-MM
  const [description,  setDescription]  = useState('');
  const [tagsRaw,      setTagsRaw]      = useState('');      // raw CSV input

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const titleRef = useRef<TextInput>(null);

  // Populate form when editing
  useEffect(() => {
    if (!visible) return;
    if (entry) {
      setCategory(entry.category);
      setTitle(entry.title);
      setOrganisation(entry.organisation ?? '');
      setDate(fromISO(entry.date));
      setEndDate(entry.endDate ? fromISO(entry.endDate) : '');
      setDescription(entry.description ?? '');
      setTagsRaw(entry.tags?.join(', ') ?? '');
    } else {
      setCategory('project');
      setTitle('');
      setOrganisation('');
      setDate('');
      setEndDate('');
      setDescription('');
      setTagsRaw('');
    }
    setError('');
  }, [visible, entry]);

  // ── Submit ──
  const handleSave = async () => {
    const t = title.trim();
    if (!t) { setError('Title is required.'); return; }
    if (!date || date.length < 7) { setError('Date is required (YYYY-MM).'); return; }

    setSaving(true);
    setError('');
    try {
      const draft: TimelineEntryDraft = {
        category,
        title:        t,
        organisation: organisation.trim() || undefined,
        date:         toISO(date),
        endDate:      endDate ? toISO(endDate) : undefined,
        description:  description.trim() || undefined,
        tags:         parseTags(tagsRaw).length > 0 ? parseTags(tagsRaw) : undefined,
        isPublic:     false,
      };
      await onSave(draft);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      statusBarTranslucent
      transparent={false}
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={S.root}>

        {/* ── Header ── */}
        <Row style={S.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={Colors.text2} />
          </Pressable>
          <Text style={S.headerTitle}>
            {isEditing ? 'Edit entry' : 'New entry'}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={12}
            style={[S.saveBtn, saving && { opacity: 0.5 }]}>
            {saving
              ? <ActivityIndicator size="small" color={Colors.accent} />
              : <Text style={S.saveTxt}>Save</Text>}
          </Pressable>
        </Row>
        <Divider />

        <ScrollView
          contentContainerStyle={S.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {error ? <ErrorBanner message={error} /> : null}

          {/* ── Category ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Type</Text>
            <View style={S.categoryGrid}>
              {CATEGORY_KEYS.map(key => {
                const cfg     = CATEGORY_CONFIG[key];
                const active  = category === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setCategory(key)}
                    style={[
                      S.categoryBtn,
                      active && { borderColor: cfg.color + '80', backgroundColor: cfg.color + '18' },
                    ]}>
                    <Ionicons
                      name={cfg.icon as any}
                      size={13}
                      color={active ? cfg.color : Colors.text3}
                    />
                    <Text style={[S.categoryBtnTxt, active && { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Title ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Title <Text style={S.required}>*</Text></Text>
            <TextInput
              ref={titleRef}
              value={title}
              onChangeText={setTitle}
              placeholder={CATEGORY_CONFIG[category].label + ' title'}
              placeholderTextColor={Colors.text4}
              style={S.input}
              returnKeyType="next"
              autoFocus={!isEditing}
            />
          </View>

          {/* ── Organisation ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Organisation / Platform</Text>
            <TextInput
              value={organisation}
              onChangeText={setOrganisation}
              placeholder="e.g. Google, Devfolio, IIT Bombay"
              placeholderTextColor={Colors.text4}
              style={S.input}
              returnKeyType="next"
            />
          </View>

          {/* ── Date row ── */}
          <Row style={S.dateRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={S.fieldLabel}>Date <Text style={S.required}>*</Text></Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM"
                placeholderTextColor={Colors.text4}
                style={S.input}
                keyboardType="numbers-and-punctuation"
                maxLength={7}
                returnKeyType="next"
              />
              {date.length >= 7 && (
                <Text style={S.dateParsed}>{toDisplay(date)}</Text>
              )}
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={S.fieldLabel}>End Date</Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM"
                placeholderTextColor={Colors.text4}
                style={S.input}
                keyboardType="numbers-and-punctuation"
                maxLength={7}
                returnKeyType="next"
              />
              {endDate.length >= 7 && (
                <Text style={S.dateParsed}>{toDisplay(endDate)}</Text>
              )}
            </View>
          </Row>

          {/* ── Description ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What did you build, learn, or achieve?"
              placeholderTextColor={Colors.text4}
              style={[S.input, S.inputMulti]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="default"
            />
          </View>

          {/* ── Tags ── */}
          <View style={S.field}>
            <Text style={S.fieldLabel}>Tags</Text>
            <TextInput
              value={tagsRaw}
              onChangeText={setTagsRaw}
              placeholder="e.g. React Native, TypeScript, AWS"
              placeholderTextColor={Colors.text4}
              style={S.input}
              returnKeyType="done"
              autoCapitalize="words"
            />
            {parseTags(tagsRaw).length > 0 && (
              <Row style={S.tagPreview}>
                {parseTags(tagsRaw).slice(0, 8).map(t => (
                  <View key={t} style={S.tagChip}>
                    <Text style={S.tagChipTxt}>{t}</Text>
                  </View>
                ))}
              </Row>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { backgroundColor: Colors.bg1, flex: 1 },

  header: {
    alignItems:      'center',
    height:          54,
    justifyContent:  'space-between',
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { ...Typography.h4, color: Colors.text0 },
  saveBtn:     { paddingHorizontal: 4, paddingVertical: 6 },
  saveTxt:     { ...Typography.uiSm, color: Colors.accent, fontWeight: '600' },

  body: {
    gap:              20,
    paddingBottom:    48,
    paddingHorizontal: Spacing.lg,
    paddingTop:       Spacing.lg,
  },

  field: { gap: 6 },
  fieldLabel: { ...Typography.uiSm, color: Colors.text1, fontWeight: '500' },
  required:   { color: Colors.danger },

  input: {
    backgroundColor: Colors.bg3,
    borderColor:     Colors.border1,
    borderRadius:    Radius.md,
    borderWidth:     1,
    color:           Colors.text0,
    fontSize:        15,
    height:          48,
    paddingHorizontal: 14,
  },
  inputMulti: {
    height:         undefined,
    minHeight:      100,
    paddingTop:     13,
    paddingBottom:  13,
  },

  // Category grid — 3 columns
  categoryGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  categoryBtn: {
    alignItems:       'center',
    borderColor:      Colors.border1,
    borderRadius:     Radius.sm,
    borderWidth:      1,
    flexDirection:    'row',
    gap:              5,
    paddingHorizontal: 10,
    paddingVertical:   8,
  },
  categoryBtnTxt: {
    ...Typography.bodyXs,
    color:      Colors.text3,
    fontWeight: '500',
  },

  // Date row
  dateRow: {
    alignItems: 'flex-start',
    gap:        12,
  },
  dateParsed: {
    ...Typography.bodyXs,
    color: Colors.text3,
    marginTop: 2,
  },

  // Tag preview
  tagPreview: {
    flexWrap: 'wrap',
    gap:      6,
    marginTop: 4,
  },
  tagChip: {
    backgroundColor:  Colors.bg4,
    borderColor:      Colors.border1,
    borderRadius:     Radius.xs,
    borderWidth:      1,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  tagChipTxt: {
    ...Typography.bodyXs,
    color:      Colors.text2,
    fontWeight: '500',
  },
});
