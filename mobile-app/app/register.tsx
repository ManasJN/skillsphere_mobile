import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authAPI } from '@/lib/api';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';

type Role = 'student' | 'faculty';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const validationError = validateForm(name, email, password);
    if (validationError) { setError(validationError); return; }
    setError('');
    setIsLoading(true);
    try {
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

          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <View style={styles.logoInner} />
            </View>
            <Text style={styles.brandName}>SkillSphere</Text>
          </View>

          {/* Headline */}
          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>Join the{'\n'}community.</Text>
            <Text style={styles.sub}>Track skills, hit goals, and grow with peers.</Text>
          </View>

          {/* Role toggle — above form for emphasis */}
          <View style={styles.roleWrap}>
            <Text style={styles.roleLabel}>I am a</Text>
            <View style={styles.roleRow}>
              {(['student', 'faculty'] as Role[]).map((item) => {
                const active = role === item;
                return (
                  <Pressable
                    disabled={isLoading}
                    key={item}
                    onPress={() => setRole(item)}
                    style={[styles.roleBtn, active && styles.roleBtnActive]}>
                    <View style={[styles.roleIcon, active && styles.roleIconActive]}>
                      <Text style={[styles.roleEmoji]}>
                        {item === 'student' ? 'Student' : 'Mentor'}
                      </Text>
                    </View>
                    <Text style={[styles.roleBtnText, active && styles.roleBtnTextActive]}>
                      {item === 'student' ? 'Student' : 'Faculty'}
                    </Text>
                    {active && <View style={styles.roleCheck}><Text style={styles.roleCheckText}>✓</Text></View>}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Full name</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
                onBlur={() => setFocusedField(null)}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                placeholder="Aarav Mehta"
                placeholderTextColor={Colors.text4}
                style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                value={name}
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Email address</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isLoading}
                inputMode="email"
                keyboardType="email-address"
                onBlur={() => setFocusedField(null)}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                placeholder="you@college.edu"
                placeholderTextColor={Colors.text4}
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                value={email}
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Password</Text>
              <View>
                <TextInput
                  autoCapitalize="none"
                  editable={!isLoading}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  placeholder="Min 6 characters"
                  placeholderTextColor={Colors.text4}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.inputWithEye, focusedField === 'password' && styles.inputFocused]}
                  value={password}
                />
                <Pressable hitSlop={12} onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorDot}>●</Text>
                <Text style={styles.errorMsg}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              disabled={isLoading}
              onPress={handleRegister}
              style={({ pressed }) => [
                styles.cta,
                isLoading && styles.ctaDisabled,
                pressed && !isLoading && styles.ctaPressed,
              ]}>
              {isLoading
                ? <ActivityIndicator color={Colors.bg1} size="small" />
                : <Text style={styles.ctaText}>Create Account →</Text>}
            </Pressable>
          </View>

          {/* Footer */}
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
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return '';
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 48, gap: 28 },

  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  logoMark: {
    alignItems: 'center', backgroundColor: Colors.accentDim, borderColor: Colors.accentMid,
    borderRadius: Radius.sm, borderWidth: 1, height: 38, justifyContent: 'center', width: 38,
  },
  logoInner: {
    backgroundColor: Colors.accent, borderRadius: 2, height: 14, width: 14,
  },
  brandName: { ...Typography.h2, color: Colors.text0 },

  headlineBlock: { gap: 8 },
  headline: { color: Colors.text0, fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34 },
  sub: { ...Typography.body, color: Colors.text2 },

  // Role
  roleWrap: { gap: 12 },
  roleLabel: { ...Typography.uiSm, color: Colors.text2, fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleBtn: {
    alignItems: 'center', backgroundColor: Colors.bg3, borderColor: Colors.border1,
    borderRadius: Radius.lg, borderWidth: 1, flex: 1, gap: 8, paddingVertical: 16,
    position: 'relative',
  },
  roleBtnActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  roleIcon: {
    alignItems: 'center', backgroundColor: Colors.bg4, borderRadius: Radius.sm,
    height: 44, justifyContent: 'center', width: 44,
  },
  roleIconActive: { backgroundColor: Colors.accentSoft },
  roleEmoji: { fontSize: 22 },
  roleBtnText: { ...Typography.uiSm, color: Colors.text2 },
  roleBtnTextActive: { color: Colors.text0, fontWeight: '700' },
  roleCheck: {
    alignItems: 'center', backgroundColor: Colors.accent, borderRadius: 10,
    height: 20, justifyContent: 'center', position: 'absolute', right: 10, top: 10, width: 20,
  },
  roleCheckText: { color: Colors.bg1, fontSize: 11, fontWeight: '600' },

  // Form
  form: { gap: 18 },
  inputWrap: { gap: 7 },
  inputLabel: { ...Typography.uiSm, color: Colors.text1, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bg4, borderColor: Colors.border1, borderRadius: Radius.md,
    borderWidth: 1, color: Colors.text0, fontSize: 16, height: 54, paddingHorizontal: Spacing.lg,
  },
  inputWithEye: { paddingRight: 72 },
  inputFocused: { borderColor: Colors.accent },
  eyeBtn: {
    alignItems: 'center', bottom: 0, justifyContent: 'center',
    paddingHorizontal: Spacing.md, position: 'absolute', right: 0, top: 0,
  },
  eyeText: { ...Typography.uiSm, color: Colors.accentLight },

  errorBox: {
    alignItems: 'flex-start', backgroundColor: '#1A0808', borderColor: '#3D1010',
    borderRadius: Radius.sm, borderWidth: 1, flexDirection: 'row', gap: 8, padding: Spacing.md,
  },
  errorDot: { color: Colors.danger, fontSize: 10, marginTop: 3 },
  errorMsg: { ...Typography.bodySm, color: Colors.danger, flex: 1 },

  cta: {
    alignItems: 'center', backgroundColor: Colors.accent, borderRadius: Radius.md,
    elevation: 3, height: 50, justifyContent: 'center', marginTop: 4,
  },
  ctaDisabled: { opacity: 0.45, shadowOpacity: 0 },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.975 }] },
  ctaText: { color: Colors.bg1, fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },

  footer: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center' },
  footerText: { ...Typography.bodySm, color: Colors.text3 },
  footerLink: { ...Typography.bodySm, color: Colors.accentLight, fontWeight: '700' },
});
