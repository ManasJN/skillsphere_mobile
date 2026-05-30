/**
 * app/index.tsx — Auth gate + role-based routing
 *
 * Routes after token validation:
 *   - role === 'faculty'           → /(faculty-tabs)/dashboard
 *   - role === 'student' (default)  → /(tabs)
 *   - No token / 401                → /login
 *
 * The role is read from /auth/me so it is always authoritative.
 *
 * FIX: Uses a `checkKey` counter incremented by login/OTP flows to force
 * a re-check even if Expo Router doesn't remount this component. Also
 * calls clearMeCache() before every check so we never use a stale cached
 * response from a previous session.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TOKEN_STORAGE_KEY, authAPI, clearMeCache } from '@/lib/api';
import { Colors } from '@/lib/theme';

type AuthState = 'checking' | 'student' | 'faculty' | 'unauthenticated';

export default function AuthGate() {
  const [state, setState] = useState<AuthState>('checking');

  // FIX: Use useFocusEffect instead of useEffect so the check re-runs
  // every time this screen gains focus — including after login/OTP flows
  // that call router.replace('/') without unmounting this component.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function check() {
        setState('checking');
        // Always clear the cache before checking — we need fresh data
        // to get the correct role, never a cached response from a prior session.
        clearMeCache();

        try {
          const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
          if (!token) {
            if (!cancelled) setState('unauthenticated');
            return;
          }

          const res  = await authAPI.me();
          const user = res.data?.data ?? res.data;
          const role = user?.role ?? '';

          if (__DEV__) {
            console.log('[AuthGate] /auth/me role:', role, 'user:', user?.name);
          }

          const isFaculty = ['faculty', 'college'].includes(
            typeof role === 'string' ? role.toLowerCase().trim() : ''
          );
          const authState: AuthState = isFaculty ? 'faculty' : 'student';
          if (!cancelled) setState(authState);
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
    }, [])
  );

  if (state === 'checking') {
    return (
      <View style={S.screen}>
        <ActivityIndicator color={Colors.accent} size="small" />
      </View>
    );
  }

  if (state === 'faculty')  return <Redirect href="/(faculty-tabs)/dashboard" />;
  if (state === 'student')  return <Redirect href="/(tabs)" />;
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
