import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
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
import { Colors, Layout, Radius, Spacing, Surface, Typography } from '@/lib/theme';
import { Button, ErrorBanner } from '@/components/ui';

const OTP_LENGTH = 6;

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

  const handleVerify = async () => {
    if (!email) {
      setError('Email missing. Please register again.');
      return;
    }
    if (otp.length !== OTP_LENGTH) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setError('');
    setMessage('');
    setIsVerifying(true);
    try {
      const res = await authAPI.verifyOtp(email, otp);
      const token = res.data?.token ?? res.data?.accessToken ?? res.data?.jwt;
      if (token) await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      router.replace('/');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.data?.message) setError(err.response.data.message);
        else if (err.request) setError('Cannot reach server. Check your connection.');
        else setError('Verification failed. Please try again.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email missing.');
      return;
    }
    setError('');
    setMessage('');
    setIsResending(true);
    await new Promise(r => setTimeout(r, 800));
    setMessage('A fresh code is on its way. Check your inbox.');
    setIsResending(false);
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : 'your email';

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}>
        <View style={styles.container}>
          <Pressable hitSlop={16} onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconText}>OTP</Text>
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.sub}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.emailHighlight}>{maskedEmail}</Text>
            </Text>
          </View>

          <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
              const char = otp[i] ?? '';
              const isActive = otp.length === i;
              const isFilled = otp.length > i;
              return (
                <View
                  key={i}
                  style={[
                    styles.otpBox,
                    isActive && styles.otpBoxActive,
                    isFilled && styles.otpBoxFilled,
                  ]}>
                  <Text style={styles.otpChar}>{char}</Text>
                  {isActive ? <View style={styles.cursor} /> : null}
                </View>
              );
            })}
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

          {error ? <ErrorBanner message={error} /> : null}
          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageMsg}>{message}</Text>
            </View>
          ) : null}

          <Button
            disabled={!canVerify}
            full
            label="Verify code"
            loading={isVerifying}
            onPress={handleVerify}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Did not receive it?</Text>
            <Pressable
              disabled={isVerifying || isResending}
              hitSlop={8}
              onPress={handleResend}>
              <Text style={styles.resendLink}>{isResending ? 'Sending' : 'Resend code'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg1, flex: 1 },
  kav: { flex: 1 },
  container: {
    flex: 1,
    gap: Spacing.xl,
    paddingBottom: 40,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
  },

  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.uiSm, color: Colors.text3 },

  header: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.lg },
  iconWrap: {
    alignItems: 'center',
    ...Surface.selected,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  iconText: { ...Typography.h4, color: Colors.accentLight },
  title: { ...Typography.h1, color: Colors.text0, textAlign: 'center' },
  sub: { ...Typography.body, color: Colors.text2, textAlign: 'center' },
  emailHighlight: { color: Colors.accentLight, fontWeight: '700' as const },

  otpRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  otpBox: {
    alignItems: 'center',
    ...Surface.inset,
    height: 56,
    justifyContent: 'center',
    position: 'relative',
    width: 46,
  },
  otpBoxActive: { borderColor: Colors.accent },
  otpBoxFilled: { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  otpChar: { ...Typography.h2, color: Colors.text0 },
  cursor: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xs,
    bottom: 10,
    height: 2,
    position: 'absolute',
    width: 18,
  },
  hiddenInput: { height: 1, opacity: 0, position: 'absolute', width: 1 },

  messageBox: { ...Surface.selected, padding: Spacing.md },
  messageMsg: { ...Typography.bodySm, color: Colors.accentLight, textAlign: 'center' },

  resendRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  resendLabel: { ...Typography.bodySm, color: Colors.text3 },
  resendLink: { ...Typography.bodySm, color: Colors.accentLight, fontWeight: '700' as const },
});
