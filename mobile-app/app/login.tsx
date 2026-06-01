/**
 * app/login.tsx — Login screen
 *
 * Changes from baseline:
 *   TASK 1 — Multi-identifier: accepts email OR roll number.
 *             Sends as `identifier` field; backend detects type automatically.
 *   TASK 2 — Password show/hide toggle with eye icon inside the input.
 *   TASK 3 — Keyboard avoidance: KeyboardAvoidingView wraps a ScrollView;
 *             `keyboardVerticalOffset` tuned per-platform so inputs stay
 *             visible when the software keyboard appears.
 *
 * Everything else (layout, animation, theme tokens, routing) is UNCHANGED.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';
import { Colors, Control, Layout, Radius, Spacing, Surface, Typography } from '@/lib/theme';
import { Button, Card, ErrorBanner } from '@/components/ui';
import { useFadeSlideIn } from '@/hooks/useAnimations';

// ─── Keyboard offset — keeps inputs above the keyboard ───────────────────────
// iOS: SafeAreaView top inset (~44-59pt) + small buffer.
// Android: 0 works with windowSoftInputMode=adjustResize (Expo default).
const KB_OFFSET = Platform.OS === 'ios' ? 60 : 0;

export default function LoginScreen() {
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_STORAGE_KEY).then(token => {
      if (token) router.replace('/');
    });
  }, []);

  const [identifier,     setIdentifier]     = useState('');
  const [password,       setPassword]       = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');

  const passwordRef = useRef<TextInput>(null);

  const brandAnim = useFadeSlideIn(0, 10);
  const cardAnim  = useFadeSlideIn(80, 10);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setError('Please enter your email / roll number and password.');
      return;
    }
    try {
      if (__DEV__) {
        console.log('[LoginScreen] login payload', {
          identifier: identifier.trim(),
          passwordPresent: Boolean(password),
        });
      }
      setLoading(true);
      setError('');
      // Send as `identifier` — backend accepts email or roll number
      const response = await authAPI.login(identifier.trim(), password);
      const token = response.data?.token ?? response.data?.accessToken ?? response.data?.jwt;
      if (!token) throw new Error('Login succeeded but no token returned from server');
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      router.replace('/');
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={S.root}>
      {/*
        TASK 3 — KeyboardAvoidingView
        `behavior='padding'` on iOS pushes the entire scroll view up by
        `keyboardVerticalOffset` when the keyboard appears, keeping inputs
        visible. On Android, Expo's default windowSoftInputMode handles this;
        setting behavior='height' as a light fallback for older devices.
      */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={KB_OFFSET}
      >
        <ScrollView
          contentContainerStyle={S.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // Prevent scroll bounce from revealing the background on iOS
          bounces={false}
        >
          {/* Brand mark — unchanged */}
          <Animated.View style={[S.brand, { opacity: brandAnim.opacity, transform: [{ translateY: brandAnim.translateY }] }]}>
            <View style={S.brandMark}>
              <Text style={S.brandLetter}>S</Text>
            </View>
            <Text style={S.brandName}>SkillSphere</Text>
            <Text style={S.brandSub}>Student productivity platform</Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View style={{ opacity: cardAnim.opacity, transform: [{ translateY: cardAnim.translateY }] }}>
            <Card style={S.card}>
              <Text style={S.cardTitle}>Welcome back</Text>
              <Text style={S.cardSub}>Sign in to continue</Text>

              {error ? <ErrorBanner message={error} /> : null}

              {/* TASK 1 — Multi-identifier input */}
              <View style={S.inputWrap}>
                <Text style={S.inputLabel}>Email or Roll Number</Text>
                <View style={S.inputBox}>
                  <TextInput
                    style={S.inputText}
                    value={identifier}
                    onChangeText={t => { setIdentifier(t); setError(''); }}
                    placeholder="you@college.edu or 21CS001"
                    placeholderTextColor={Colors.text4}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* TASK 2 — Password with show/hide toggle */}
              <View style={S.inputWrap}>
                <Text style={S.inputLabel}>Password</Text>
                <View style={S.inputBox}>
                  <TextInput
                    ref={passwordRef}
                    style={S.inputText}
                    value={password}
                    onChangeText={t => { setPassword(t); setError(''); }}
                    placeholder="Your password"
                    placeholderTextColor={Colors.text4}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                  {/* Eye toggle — sits inside the input box on the right */}
                  <Pressable
                    onPress={() => setShowPassword(v => !v)}
                    hitSlop={10}
                    style={S.eyeBtn}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.text3}
                    />
                  </Pressable>
                </View>
              </View>

              <Button
                label="Sign in"
                onPress={handleLogin}
                loading={loading}
                full
                style={{ marginTop: 4 }}
              />

              <Pressable onPress={() => router.push('/register')} style={S.linkRow} hitSlop={8}>
                <Text style={S.linkText}>
                  Don&apos;t have an account?{' '}
                  <Text style={S.linkAccent}>Register</Text>
                </Text>
              </Pressable>
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Inline input styles mirror the shared <Input> component from @/components/ui
// exactly — same Surface.inset, same typography tokens, same focus border.
// They are inlined here only because TASK 2 requires injecting a Pressable
// child inside the input box, which the generic <Input> component does support
// via `rightElement` — but using it inline avoids any prop-threading complexity.

const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.bg1 },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.xxxl,
    gap: Spacing.xxl,
  },

  // Brand — unchanged
  brand: { alignItems: 'center', gap: 10 },
  brandMark: {
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  brandLetter: { ...Typography.h2, color: Colors.accent },
  brandName:   { ...Typography.h2, color: Colors.text0 },
  brandSub:    { ...Typography.bodySm, color: Colors.text3 },

  // Card — unchanged
  card: {
    ...Surface.card,
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  cardTitle: { ...Typography.h2, color: Colors.text0, marginBottom: 2 },
  cardSub:   { ...Typography.bodySm, color: Colors.text3, marginBottom: 4 },

  // Inputs — mirrors @/components/ui Input styles exactly
  inputWrap:  { gap: 6 },
  inputLabel: { ...Typography.uiSm, color: Colors.text1, fontWeight: '500' as const },
  inputBox: {
    alignItems: 'center',
    ...Surface.inset,
    flexDirection: 'row',
  },
  inputText: {
    ...Typography.body,
    color: Colors.text0,
    flex: 1,
    height: Control.inputHeight,
    paddingHorizontal: Spacing.md,
  },

  // Eye button — flush right inside the input box
  eyeBtn: {
    paddingHorizontal: 12,
    height: Control.inputHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Link — unchanged
  linkRow:    { alignItems: 'center', paddingTop: 4 },
  linkText:   { ...Typography.bodySm, color: Colors.text3, textAlign: 'center' },
  linkAccent: { color: Colors.accent },
});
