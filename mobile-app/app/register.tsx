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

type Role = 'student' | 'faculty';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      // Backend expects "name" — not "fullName"
      await authAPI.register(name.trim(), email.trim().toLowerCase(), password, role);

      router.push({
        pathname: '/otp-verification',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.response?.status === 409) {
          setError('An account with this email already exists.');
        } else if (err.request) {
          setError(
            'Unable to reach the server. Make sure the backend is running and your device is on the same Wi-Fi network.',
          );
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        setError('Registration failed. Please try again.');
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
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brand}>SkillSphere</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Join your learning community and start tracking progress.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
                onChangeText={setName}
                placeholder="Aarav Mehta"
                placeholderTextColor="#64748B"
                style={styles.input}
                value={name}
              />
            </View>

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
                placeholder="Create a password (min 6 chars)"
                placeholderTextColor="#64748B"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow}>
                {(['student', 'faculty'] as Role[]).map((item) => {
                  const isSelected = role === item;
                  return (
                    <Pressable
                      disabled={isLoading}
                      key={item}
                      onPress={() => setRole(item)}
                      style={[styles.roleButton, isSelected && styles.roleButtonSelected]}>
                      <Text style={[styles.roleText, isSelected && styles.roleTextSelected]}>
                        {item === 'student' ? 'Student' : 'Faculty'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              disabled={isLoading}
              onPress={handleRegister}
              style={({ pressed }) => [
                styles.button,
                isLoading && styles.buttonDisabled,
                pressed && !isLoading && styles.buttonPressed,
              ]}>
              {isLoading ? (
                <ActivityIndicator color="#042F2E" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.replace('/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginHighlight}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function validateForm(name: string, email: string, password: string) {
  if (name.trim().length < 2) return 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return '';
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#080B12', flex: 1 },
  keyboardView: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20 },
  header: { gap: 8 },
  brand: { color: '#5EEAD4', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#F8FAFC', fontSize: 34, fontWeight: '900' },
  subtitle: { color: '#94A3B8', fontSize: 16, lineHeight: 23 },
  form: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  inputGroup: { gap: 8 },
  label: { color: '#CBD5E1', fontSize: 14, fontWeight: '800' },
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
  roleRow: { flexDirection: 'row', gap: 10 },
  roleButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#263449',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  roleButtonSelected: { backgroundColor: '#134E4A', borderColor: '#5EEAD4' },
  roleText: { color: '#94A3B8', fontSize: 15, fontWeight: '800' },
  roleTextSelected: { color: '#F8FAFC' },
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
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  buttonText: { color: '#042F2E', fontSize: 16, fontWeight: '900' },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginText: { color: '#64748B', fontSize: 15 },
  loginHighlight: { color: '#5EEAD4', fontWeight: '900' },
});
