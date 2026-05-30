/**
 * app/index.tsx — Auth gate + role-based routing
 *
 * Routes after token validation:
 *   - role === 'faculty'           → /(faculty-tabs)
 *   - role === 'student' (default)  → /(tabs)
 *   - No token / 401                → /login
 *
 * The role is read from /auth/me so it is always authoritative.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';
import { Colors } from '@/lib/theme';

type AuthState = 'checking' | 'student' | 'faculty' | 'unauthenticated';

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

        const res  = await authAPI.me();
        const user = res.data?.data ?? res.data;
        const isFaculty = ['faculty', 'college'].includes(user?.role);
        const role: AuthState = isFaculty ? 'faculty' : 'student';
        if (!cancelled) setState(role);
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
