import axios, { AxiosError, isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { useRef, useState } from 'react';
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

const API_BASE_URL = 'http://10.38.159.20:5000/api';
const OTP_LENGTH = 6;

type ErrorResponse = {
  error?: string;
  message?: string;
};

export default function OtpVerificationScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const canVerify = otp.length === OTP_LENGTH && !isVerifying && !isResending;

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
    setError('');
    setMessage('');
  };

  const handleVerifyOtp = async () => {
    if (!email) {
      setError('Email is missing. Please register again.');
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setError('Enter the 6 digit OTP sent to your email.');
      return;
    }

    setError('');
    setMessage('');
    setIsVerifying(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email,
        otp,
      });

      router.replace('/login' as unknown as Href);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(getAxiosErrorMessage(err));
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setIsResending(true);

    setTimeout(() => {
      setIsResending(false);
      setMessage('A new OTP request can be sent once the backend resend endpoint is available.');
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.brand}>SkillSphere</Text>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6 digit code sent to {email ?? 'your registered email'}.
            </Text>
          </View>

          <View style={styles.card}>
            <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <View
                  key={index}
                  style={[styles.otpBox, otp.length === index && styles.otpBoxActive]}>
                  <Text style={styles.otpText}>{otp[index] ?? ''}</Text>
                </View>
              ))}
            </Pressable>

            <TextInput
              ref={inputRef}
              autoFocus
              caretHidden
              editable={!isVerifying && !isResending}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              onChangeText={handleOtpChange}
              style={styles.hiddenInput}
              textContentType="oneTimeCode"
              value={otp}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {message ? <Text style={styles.messageText}>{message}</Text> : null}

            <Pressable
              disabled={!canVerify}
              onPress={handleVerifyOtp}
              style={({ pressed }) => [
                styles.button,
                !canVerify && styles.buttonDisabled,
                pressed && canVerify && styles.buttonPressed,
              ]}>
              {isVerifying ? (
                <ActivityIndicator color="#042F2E" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </Pressable>

            <Pressable
              disabled={isVerifying || isResending}
              onPress={handleResendOtp}
              style={styles.resendButton}>
              {isResending ? (
                <ActivityIndicator color="#5EEAD4" />
              ) : (
                <Text style={styles.resendText}>Resend OTP</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getAxiosErrorMessage(error: AxiosError<ErrorResponse>) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.request) {
    return 'Unable to reach the server. Check your API URL and network connection.';
  }

  return 'OTP verification failed. Please try again.';
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
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  otpBox: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#263449',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 54,
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#5EEAD4',
  },
  otpText: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
  },
  hiddenInput: {
    height: 1,
    opacity: 0,
    position: 'absolute',
    width: 1,
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
  messageText: {
    backgroundColor: '#0F2F2D',
    borderColor: '#134E4A',
    borderRadius: 8,
    borderWidth: 1,
    color: '#99F6E4',
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
  resendButton: {
    alignItems: 'center',
    minHeight: 42,
    justifyContent: 'center',
  },
  resendText: {
    color: '#5EEAD4',
    fontSize: 15,
    fontWeight: '900',
  },
});
