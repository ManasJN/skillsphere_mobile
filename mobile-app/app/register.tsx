import axios, { AxiosError, isAxiosError } from 'axios';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
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

const API_BASE_URL = 'http://10.38.159.20:5000/api';

type Role = 'student' | 'faculty';

type ErrorResponse = {
  error?: string;
  message?: string;
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const validationError = validateForm(fullName, email, password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        password,
        role,
      });

      router.push({
        pathname: '/otp-verification',
        params: {
          email: email.trim().toLowerCase(),
          role,
        },
      } as unknown as Href);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(getAxiosErrorMessage(err));
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
            <Text style={styles.subtitle}>Join your learning community and start tracking progress.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
                onChangeText={setFullName}
                placeholder="Aarav Mehta"
                placeholderTextColor="#64748B"
                style={styles.input}
                value={fullName}
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
                placeholder="Create a password"
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function validateForm(fullName: string, email: string, password: string) {
  if (fullName.trim().length < 2) {
    return 'Enter your full name.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return '';
}

function getAxiosErrorMessage(error: AxiosError<ErrorResponse>) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.status === 409) {
    return 'An account with this email already exists.';
  }

  if (error.request) {
    return 'Unable to reach the server. Check your API URL and network connection.';
  }

  return 'Registration failed. Please try again.';
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    gap: 8,
    marginBottom: 28,
  },
  brand: {
    color: '#5EEAD4',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
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
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
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
  roleButtonSelected: {
    backgroundColor: '#134E4A',
    borderColor: '#5EEAD4',
  },
  roleText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
  },
  roleTextSelected: {
    color: '#F8FAFC',
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
});
