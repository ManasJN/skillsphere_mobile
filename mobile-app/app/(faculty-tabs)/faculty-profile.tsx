/**
 * app/(faculty-tabs)/faculty-profile.tsx — Faculty Profile
 *
 * Lightweight profile for the faculty/college account.
 * Shows college identity, contact info, and a sign-out button.
 * Deliberately simpler than the student profile — faculty identity
 * is institutional, not a portfolio.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';
import {
  Colors, Layout, NAV_BOTTOM_OFFSET, Radius,
  Spacing, Surface, Typography,
} from '@/lib/theme';
import { Row } from '@/components/ui';

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <Row style={S.infoRow}>
      <View style={S.infoIconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.infoLabel}>{label}</Text>
        <Text style={S.infoValue}>{value}</Text>
      </View>
    </Row>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type FacultyUser = {
  name: string;
  email: string;
  role: string;
  college?: string;
  collegeId?: { collegeName?: string; domain?: string };
  department?: string;
  phone?: string;
  createdAt?: string;
};

export default function FacultyProfileScreen() {
  const [user, setUser]         = useState<FacultyUser | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await authAPI.me();
      setUser(res.data?.data ?? res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not load profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await authAPI.logout();
            } catch { /* ignore */ }
            await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
            router.replace('/');
          },
        },
      ],
    );
  }, []);

  const collegeName = user?.collegeId?.collegeName ?? user?.college ?? '—';
  const domain      = user?.collegeId?.domain;
  const joined      = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : undefined;

  const initials = (user?.name ?? 'F')
    .split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView edges={['top']} style={S.root}>
      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: NAV_BOTTOM_OFFSET + Spacing.xxl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={S.hero}>
          <View style={S.avatarWrap}>
            <Text style={S.avatarText}>{initials}</Text>
          </View>
          <Text style={S.name}>{user?.name ?? (loading ? '…' : '—')}</Text>
          <Text style={S.college}>{collegeName}</Text>

          {/* Role chip */}
          <View style={S.roleChip}>
            <Ionicons name="school-outline" size={12} color={Colors.accent} />
            <Text style={S.roleChipText}>Faculty · College Account</Text>
          </View>
        </View>

        {error ? (
          <View style={S.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text style={S.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Details card */}
        <Text style={S.sectionTitle}>Account Details</Text>
        <View style={S.card}>
          <InfoRow icon="mail-outline"       label="Email"      value={user?.email} />
          <View style={S.divider} />
          <InfoRow icon="business-outline"   label="College"    value={collegeName} />
          {domain && (
            <>
              <View style={S.divider} />
              <InfoRow icon="globe-outline"  label="Domain"     value={domain} />
            </>
          )}
          {user?.department && (
            <>
              <View style={S.divider} />
              <InfoRow icon="library-outline" label="Department" value={user.department} />
            </>
          )}
          {joined && (
            <>
              <View style={S.divider} />
              <InfoRow icon="calendar-outline" label="Member since" value={joined} />
            </>
          )}
        </View>

        {/* Platform info */}
        <Text style={S.sectionTitle}>Platform</Text>
        <View style={S.card}>
          <Row style={S.infoRow}>
            <View style={S.infoIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.infoLabel}>Role</Text>
              <Text style={S.infoValue}>College / Faculty</Text>
            </View>
          </Row>
          <View style={S.divider} />
          <Row style={S.infoRow}>
            <View style={S.infoIconWrap}>
              <Ionicons name="layers-outline" size={16} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.infoLabel}>Phase</Text>
              <Text style={S.infoValue}>Phase 1 — Student Visibility</Text>
            </View>
          </Row>
        </View>

        {/* Logout */}
        <Pressable
          style={S.logoutCard}
          onPress={handleLogout}
          disabled={loggingOut}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={S.logoutText}>
            {loggingOut ? 'Signing out…' : 'Sign out of SkillSphere'}
          </Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg1 },
  scroll: { paddingHorizontal: Layout.screenPadding, gap: Spacing.md },

  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: Radius.full,
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  avatarText: { ...Typography.h2, color: Colors.accent },
  name:       { ...Typography.h2, color: Colors.text0, textAlign: 'center' },
  college:    { ...Typography.bodySm, color: Colors.text3, textAlign: 'center' },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid, borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
    marginTop: Spacing.xs,
  },
  roleChipText: { ...Typography.bodyXs, color: Colors.accent, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.status.dangerBg,
    borderColor: Colors.status.dangerBorder, borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: { ...Typography.bodySm, color: Colors.danger, flex: 1 },

  sectionTitle: { ...Typography.h4, color: Colors.text1 },

  card: {
    ...Surface.card,
    padding: 0,
    overflow: 'hidden',
  },

  infoRow: {
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: Radius.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { ...Typography.bodyXs, color: Colors.text4, marginBottom: 2 },
  infoValue: { ...Typography.uiSm,   color: Colors.text0 },

  divider: { height: 1, backgroundColor: Colors.border0, marginHorizontal: Spacing.md },

  logoutCard: {
    ...Surface.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderColor: Colors.status.dangerBorder,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logoutText: { ...Typography.ui, color: Colors.danger },
});
