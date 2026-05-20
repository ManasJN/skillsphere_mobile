import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_STORAGE_KEY, authAPI } from '@/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      if (__DEV__) console.log('[Login] calling authAPI.login', { email: email.trim() });

      const response = await authAPI.login(email.trim(), password);

      if (__DEV__) console.log('[Login] response', { status: response.status, data: response.data });

      const token = response.data?.token ?? response.data?.accessToken ?? response.data?.jwt;
      if (!token) throw new Error('Login succeeded but no token returned from server');

      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (__DEV__) console.log('[Login] error', err);
      const message = err?.response?.data?.message ?? err?.message ?? String(err);
      setError(message);
      Alert.alert('LOGIN ERROR', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to continue using SkillSphere</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  linkText: {
    color: '#60a5fa',
    marginTop: 20,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 13,
  },
});