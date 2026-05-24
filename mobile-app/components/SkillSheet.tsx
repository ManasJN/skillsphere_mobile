/**
 * SkillSheet — add or edit a skill.
 *
 * Modal sheet presented from the profile screen.
 * Handles both create and edit in one form.
 *
 * Fields: name, category, level (0-100 slider via text input), description.
 * Matches the server skillRules validation schema.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View,
} from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/lib/theme';
import { Divider, ErrorBanner, Row } from '@/components/ui';

const CATEGORIES = [
  'Web Development', 'AI/ML', 'Cloud', 'DSA', 'UI/UX',
  'Data Science', 'Mobile', 'DevOps', 'Cybersecurity',
  'Database', 'Blockchain', 'Other',
] as const;

type SkillDraft = {
  name: string;
  category: string;
  level: number;
  description?: string;
};

type Skill = {
  _id?: string;
  name?: string;
  category?: string;
  level?: number;
  description?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (draft: SkillDraft) => Promise<void>;
  skill?: Skill | null;
};

export function SkillSheet({ visible, onClose, onSave, skill }: Props) {
  const isEdit = !!skill?._id;

  const [name,        setName]     = useState('');
  const [category,    setCat]      = useState('Web Development');
  const [levelStr,    setLevelStr] = useState('50');
  const [description, setDesc]     = useState('');
  const [saving,      setSaving]   = useState(false);
  const [error,       setError]    = useState('');

  useEffect(() => {
    if (!visible) return;
    if (skill) {
      setName(skill.name ?? '');
      setCat(skill.category ?? 'Web Development');
      setLevelStr(String(skill.level ?? 50));
      setDesc(skill.description ?? '');
    } else {
      setName(''); setCat('Web Development'); setLevelStr('50'); setDesc('');
    }
    setError(''); setSaving(false);
  }, [visible, skill]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Skill name is required.'); return; }
    const level = Math.min(100, Math.max(0, parseInt(levelStr, 10) || 0));
    setSaving(true); setError('');
    try {
      await onSave({ name: trimmed, category, level, description: description.trim() || undefined });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not save skill.');
    } finally { setSaving(false); }
  };

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

        <View style={S.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={Colors.text2} />
          </Pressable>
          <Text style={S.headerTitle}>{isEdit ? 'Edit skill' : 'Add skill'}</Text>
          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={[S.saveBtn, saving && { opacity: 0.5 }]}>
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

          <View style={S.field}>
            <Text style={S.label}>Skill name <Text style={{ color: Colors.danger }}>*</Text></Text>
            <TextInput
              autoCapitalize="words"
              autoFocus={!isEdit}
              maxLength={100}
              onChangeText={setName}
              placeholder="e.g. React Native, Machine Learning"
              placeholderTextColor={Colors.text4}
              style={S.input}
              value={name}
            />
          </View>

          <View style={S.field}>
            <Text style={S.label}>Category</Text>
            <View style={S.catGrid}>
              {CATEGORIES.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setCat(c)}
                  style={[S.catChip, category === c && S.catChipActive]}>
                  <Text style={[S.catTxt, category === c && S.catTxtActive]}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={S.field}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={S.label}>Proficiency level</Text>
              <Text style={[S.label, { color: Colors.accent }]}>
                {Math.min(100, Math.max(0, parseInt(levelStr, 10) || 0))}%
              </Text>
            </Row>
            <TextInput
              keyboardType="numeric"
              maxLength={3}
              onChangeText={setLevelStr}
              placeholder="0–100"
              placeholderTextColor={Colors.text4}
              style={S.input}
              value={levelStr}
            />
            <Text style={S.hint}>0 = just started · 100 = expert</Text>
          </View>

          <View style={S.field}>
            <Text style={S.label}>Note <Text style={{ color: Colors.text3, fontWeight: '400' as const }}>(optional)</Text></Text>
            <TextInput
              autoCapitalize="sentences"
              maxLength={200}
              multiline
              onChangeText={setDesc}
              placeholder="Anything to note about your experience"
              placeholderTextColor={Colors.text4}
              style={[S.input, { height: 72, paddingTop: 12, textAlignVertical: 'top' }]}
              value={description}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const S = StyleSheet.create({
  root:    { backgroundColor: Colors.bg1, flex: 1 },
  header:  {
    alignItems: 'center', flexDirection: 'row',
    height: 54, justifyContent: 'space-between', paddingHorizontal: Spacing.lg,
  },
  headerTitle: { ...Typography.h4, color: Colors.text0 },
  saveBtn: {
    alignItems: 'center', backgroundColor: Colors.accent,
    borderRadius: Radius.sm, height: 34, justifyContent: 'center',
    minWidth: 64, paddingHorizontal: 16,
  },
  saveTxt: { ...Typography.uiSm, color: Colors.bg1, fontWeight: '700' as const },
  body:    { gap: Spacing.xl, paddingBottom: 40, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  field:   { gap: 8 },
  label:   { ...Typography.uiSm, color: Colors.text1, fontWeight: '600' as const },
  hint:    { ...Typography.bodyXs, color: Colors.text3 },
  input: {
    backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1,
    color: Colors.text0, fontSize: 15, height: 48, paddingHorizontal: 14,
  },
  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  catChip:     {
    backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7,
  },
  catChipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  catTxt:       { ...Typography.bodySm, color: Colors.text2 },
  catTxtActive: { color: Colors.accentLight, fontWeight: '600' as const },
});
