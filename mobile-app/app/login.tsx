import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  const handleLogin = async () => {
    if (!canSubmit) {
      setError('Enter your email and password to continue.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.login(email.trim().toLowerCase(), password);

      // Backend returns { success, token, refreshToken, user }
      const token = response.data.token ?? response.data.accessToken ?? response.data.jwt;

      if (!token) {
        setError('Login succeeded but no token was returned. Contact support.');
        return;
      }

      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      router.replace('/(tabs)');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.response?.status === 401) {
          setError('Invalid email or password.');
        } else if (err.request) {
          setError(
            'Unable to reach the server. Make sure the backend is running and your device is on the same Wi-Fi network.',
          );
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.brand}>SkillSphere</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your learning streak.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isLoading}
                inputMode="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#64748B"
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                editable={!isLoading}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#64748B"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              disabled={!canSubmit}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.buttonPressed,
              ]}>
              {isLoading ? (
                <ActivityIndicator color="#042F2E" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.push('/register')} style={styles.signupLink}>
            <Text style={styles.signupText}>
              Don&apos;t have an account?{' '}
              <Text style={styles.signupHighlight}>Sign up</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#080B12',
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  brand: {
    color: '#5EEAD4',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 23,
  },
  form: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#111827',
    borderColor: '#263449',
    borderRadius: 8,
    borderWidth: 1,
    color: '#F8FAFC',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  errorText: {
    backgroundColor: '#451A1A',
    borderColor: '#7F1D1D',
    borderRadius: 8,
    borderWidth: 1,
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    padding: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#5EEAD4',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#042F2E',
    fontSize: 16,
    fontWeight: '900',
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signupText: {
    color: '#64748B',
    fontSize: 15,
  },
  signupHighlight: {
    color: '#5EEAD4',
    fontWeight: '900',
  },
});
