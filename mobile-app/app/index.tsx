/**
 * app/index.tsx — Auth gate
 *
 * This is the first screen Expo Router renders (root index route).
 * It checks for a stored JWT, validates it against /auth/me, then routes:
 *   - Token exists + valid  → /(tabs)   (returning user, skip login)
 *   - Token missing/invalid → /login    (new or logged-out user)
 *
 * Shows a minimal loading state while checking — no flash of login screen
 * for authenticated users.
 *
 * Why this exists:
 *   initialRouteName="login" in _layout.tsx always renders login first.
 *   This index route intercepts before any tab/login screen renders and
 *   redirects silently. The animation="none" on redirect prevents any flicker.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';
import { Colors } from '@/lib/theme';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export default function AuthGate() {
  const [state, setState] = useState<AuthState>('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
          if (!cancelled) setState('unauthenticated');
          return;
        }
        // Validate the token is still accepted by the server.
        // If /auth/me returns 401, the response interceptor in api.ts will
        // clear the token and redirect — but we catch it here too for safety.
        await authAPI.me();
        if (!cancelled) setState('authenticated');
      } catch (err: any) {
        if (!cancelled) {
          if (err?.response?.status === 401) {
            await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
          }
          setState('unauthenticated');
        }
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  if (state === 'checking') {
    return (
      <View style={S.screen}>
        <ActivityIndicator color={Colors.accent} size="small" />
      </View>
    );
  }

  if (state === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}

const S = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: Colors.bg1,
    flex: 1,
    justifyContent: 'center',
  },
});
