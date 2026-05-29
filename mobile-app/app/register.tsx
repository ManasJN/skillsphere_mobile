import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authAPI } from '@/lib/api';
import { Colors, Layout, Radius, Spacing, Surface, Typography } from '@/lib/theme';
import { Button, ErrorBanner, Input } from '@/components/ui';

type Role = 'student' | 'faculty';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const validationError = validateForm(name, email, password);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      if (__DEV__) {
        console.log('[RegisterScreen] register payload', {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        });
      }
      await authAPI.register(name.trim(), email.trim().toLowerCase(), password, role);
      router.push({ pathname: '/otp-verification', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.data?.message) setError(err.response.data.message);
        else if (err.response?.status === 409) setError('An account with this email already exists.');
        else if (err.request) setError('Cannot reach server. Check your Wi-Fi and backend.');
        else setError('Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.brandName}>SkillSphere</Text>
          </View>

          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>Create account</Text>
            <Text style={styles.sub}>Track skills, goals, projects, and career progress.</Text>
          </View>

          <View style={styles.roleWrap}>
            <Text style={styles.roleLabel}>Account type</Text>
            <View style={styles.roleRow}>
              {(['student', 'faculty'] as Role[]).map((item) => {
                const active = role === item;
                return (
                  <Pressable
                    disabled={isLoading}
                    key={item}
                    onPress={() => setRole(item)}
                    style={[styles.roleBtn, active && styles.roleBtnActive]}>
                    <Text style={[styles.roleBtnText, active && styles.roleBtnTextActive]}>
                      {item === 'student' ? 'Student' : 'Faculty'}
                    </Text>
                    {active ? <View style={styles.activeDot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.form}>
            <Input
              autoCapitalize="words"
              editable={!isLoading}
              label="Full name"
              onChangeText={setName}
              placeholder="Aarav Mehta"
              value={name}
            />
            <Input
              editable={!isLoading}
              keyboardType="email-address"
              label="Email address"
              onChangeText={setEmail}
              placeholder="you@college.edu"
              value={email}
            />
            <Input
              editable={!isLoading}
              label="Password"
              onChangeText={setPassword}
              placeholder="Min 8 characters"
              rightElement={
                <Pressable hitSlop={12} onPress={() => setShowPassword(p => !p)}>
                  <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              }
              secureTextEntry={!showPassword}
              value={password}
            />

            {error ? <ErrorBanner message={error} /> : null}

            <Button
              disabled={isLoading}
              full
              label="Create account"
              loading={isLoading}
              onPress={handleRegister}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable hitSlop={8} onPress={() => router.replace('/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function validateForm(name: string, email: string, password: string) {
  if (name.trim().length < 2) return 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return '';
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    gap: Spacing.xxl,
    paddingBottom: 48,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl,
  },

  brandRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
  logoMark: {
    alignItems: 'center',
    ...Surface.selected,
    borderRadius: Radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  logoText: { ...Typography.h4, color: Colors.accentLight },
  brandName: { ...Typography.h2, color: Colors.text0 },

  headlineBlock: { gap: Spacing.sm },
  headline: { ...Typography.h1, color: Colors.text0 },
  sub: { ...Typography.body, color: Colors.text2 },

  roleWrap: { gap: Spacing.md },
  roleLabel: { ...Typography.uiSm, color: Colors.text2, fontWeight: '600' as const },
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleBtn: {
    alignItems: 'center',
    ...Surface.inset,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  roleBtnActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid,
  },
  roleBtnText: { ...Typography.uiSm, color: Colors.text2 },
  roleBtnTextActive: { color: Colors.text0, fontWeight: '700' as const },
  activeDot: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    height: 6,
    width: 6,
  },

  form: { gap: Spacing.lg },
  eyeText: { ...Typography.uiSm, color: Colors.accentLight },

  footer: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  footerText: { ...Typography.bodySm, color: Colors.text3 },
  footerLink: { ...Typography.bodySm, color: Colors.accentLight, fontWeight: '700' as const },
});
