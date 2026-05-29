import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';
import { Colors, Layout, Radius, Spacing, Surface, Typography } from '@/lib/theme';
import { Button, Card, ErrorBanner, Input } from '@/components/ui';
import { useFadeSlideIn } from '@/hooks/useAnimations';

export default function LoginScreen() {
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_STORAGE_KEY).then(token => {
      if (token) router.replace('/(tabs)');
    });
  }, []);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const brandAnim = useFadeSlideIn(0, 10);
  const cardAnim  = useFadeSlideIn(80, 10);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      if (__DEV__) {
        console.log('[LoginScreen] login payload', { email: email.trim(), password });
      }
      setLoading(true);
      setError('');
      const response = await authAPI.login(email.trim(), password);
      const token = response.data?.token ?? response.data?.accessToken ?? response.data?.jwt;
      if (!token) throw new Error('Login succeeded but no token returned from server');
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      router.replace('/(tabs)');
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={S.root}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Brand mark */}
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

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@college.edu"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
            />

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

const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.bg1 },
  scroll:{
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.xxxl,
    gap: Spacing.xxl,
  },

  // Brand
  brand:      { alignItems: 'center', gap: 10 },
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

  // Card
  card: {
    ...Surface.card,
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  cardTitle: { ...Typography.h2, color: Colors.text0, marginBottom: 2 },
  cardSub:   { ...Typography.bodySm, color: Colors.text3, marginBottom: 4 },

  // Link
  linkRow:   { alignItems: 'center', paddingTop: 4 },
  linkText:  { ...Typography.bodySm, color: Colors.text3, textAlign: 'center' },
  linkAccent:{ color: Colors.accent },
});
