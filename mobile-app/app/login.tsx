import AsyncStorage from '@react-native-async-storage/async-storage';
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

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  const handleLogin = async () => {
    if (!canSubmit) { setError('Please fill in all fields.'); return; }
    setError('');
    setIsLoading(true);
    try {
      const response = await authAPI.login(email.trim().toLowerCase(), password);
      const token = response.data.token ?? response.data.accessToken ?? response.data.jwt;
      if (!token) { setError('Login succeeded but no token returned. Please contact support.'); return; }
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      router.replace('/(tabs)');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.data?.message) setError(err.response.data.message);
        else if (err.response?.status === 401) setError('Invalid email or password.');
        else if (err.request) setError('Cannot reach server. Check your Wi-Fi and backend.');
        else setError('Login failed. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Logo / Brand ── */}
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <View style={styles.logoInner} />
            </View>
            <Text style={styles.brandName}>SkillSphere</Text>
          </View>

          {/* ── Headline ── */}
          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>Welcome{'\n'}back.</Text>
            <Text style={styles.sub}>Continue your growth journey.</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
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
                placeholder="you@example.com"
                placeholderTextColor={Colors.text4}
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                value={email}
              />
            </View>

            <View style={styles.inputWrap}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  autoCapitalize="none"
                  editable={!isLoading}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.text4}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.inputPassword, focusedField === 'password' && styles.inputFocused]}
                  value={password}
                />
                <Pressable
                  hitSlop={12}
                  onPress={() => setShowPassword((p) => !p)}
                  style={styles.eyeBtn}>
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
              disabled={!canSubmit}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.cta,
                !canSubmit && styles.ctaDisabled,
                pressed && canSubmit && styles.ctaPressed,
              ]}>
              {isLoading ? (
                <ActivityIndicator color={Colors.bg0} size="small" />
              ) : (
                <Text style={styles.ctaText}>Sign in</Text>
              )}
            </Pressable>
          </View>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>New here?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Register Link ── */}
          <Pressable onPress={() => router.push('/register')} style={styles.registerBtn}>
            <Text style={styles.registerBtnText}>Create an account</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40, gap: 32 },

  // Brand
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  logoMark: {
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    borderColor: '#1A4A40',
    borderRadius: Radius.sm,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  logoInner: {
    backgroundColor: Colors.accent,
    borderRadius: 3,
    height: 18,
    transform: [{ rotate: '45deg' }],
    width: 18,
  },
  brandName: { ...Typography.h2, color: Colors.text0, fontWeight: '800' },

  // Headline
  headlineBlock: { gap: 8 },
  headline: {
    color: Colors.text0,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  sub: { ...Typography.body, color: Colors.text2 },

  // Form
  form: { gap: 20 },
  inputWrap: { gap: 8 },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  inputLabel: { ...Typography.uiSm, color: Colors.text1, fontWeight: '600' },
  inputContainer: { position: 'relative' },
  input: {
    backgroundColor: Colors.bg4,
    borderColor: Colors.border1,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.text0,
    fontSize: 16,
    height: 54,
    paddingHorizontal: Spacing.lg,
  },
  inputPassword: { paddingRight: 72 },
  inputFocused: { borderColor: Colors.accent },
  eyeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    position: 'absolute',
    right: 0,
    bottom: 0,
    top: 0,
  },
  eyeText: { ...Typography.uiSm, color: Colors.accentText },

  // Error
  errorBox: {
    alignItems: 'flex-start',
    backgroundColor: '#1C0000',
    borderColor: '#4C0519',
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.md,
  },
  errorDot: { color: Colors.danger, fontSize: 10, marginTop: 3 },
  errorMsg: { ...Typography.bodySm, color: Colors.danger, flex: 1 },

  // CTA
  cta: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    height: 54,
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 4,
  },
  ctaDisabled: { opacity: 0.45, shadowOpacity: 0 },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.975 }] },
  ctaText: { color: Colors.bg0, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // Divider
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  dividerLine: { backgroundColor: Colors.border0, flex: 1, height: 1 },
  dividerText: { ...Typography.bodySm, color: Colors.text3 },

  // Register
  registerBtn: {
    alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderColor: Colors.border2,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
  },
  registerBtnText: { ...Typography.ui, color: Colors.text0 },
});
