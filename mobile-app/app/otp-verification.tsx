import { isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
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

import { authAPI } from '@/lib/api';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';

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
    if (!email) { setError('Email missing. Please register again.'); return; }
    if (otp.length !== OTP_LENGTH) { setError('Enter the full 6-digit code.'); return; }
    setError(''); setMessage(''); setIsVerifying(true);
    try {
      await authAPI.verifyOtp(email, otp);
      router.replace('/login');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.data?.message) setError(err.response.data.message);
        else if (err.request) setError('Cannot reach server. Check your connection.');
        else setError('Verification failed. Please try again.');
      } else { setError('Verification failed. Please try again.'); }
    } finally { setIsVerifying(false); }
  };

  const handleResend = async () => {
    if (!email) { setError('Email missing.'); return; }
    setError(''); setMessage(''); setIsResending(true);
    await new Promise(r => setTimeout(r, 800));
    setMessage('A fresh code is on its way. Check your inbox.');
    setIsResending(false);
  };

  // Mask email for display
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : 'your email';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}>

        <View style={styles.container}>

          {/* Back */}
          <Pressable hitSlop={16} onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconEmoji}>✉️</Text>
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.sub}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.emailHighlight}>{maskedEmail}</Text>
            </Text>
          </View>

          {/* OTP boxes */}
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
                  {isActive && <View style={styles.cursor} />}
                </View>
              );
            })}
          </Pressable>

          {/* Hidden real input */}
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

          {/* Feedback */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorDot}>●</Text>
              <Text style={styles.errorMsg}>{error}</Text>
            </View>
          ) : null}
          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageMsg}>{message}</Text>
            </View>
          ) : null}

          {/* Verify CTA */}
          <Pressable
            disabled={!canVerify}
            onPress={handleVerify}
            style={({ pressed }) => [
              styles.cta,
              !canVerify && styles.ctaDisabled,
              pressed && canVerify && styles.ctaPressed,
            ]}>
            {isVerifying
              ? <ActivityIndicator color={Colors.bg0} size="small" />
              : <Text style={styles.ctaText}>Verify code</Text>}
          </Pressable>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive it?</Text>
            <Pressable
              disabled={isVerifying || isResending}
              hitSlop={8}
              onPress={handleResend}>
              {isResending
                ? <ActivityIndicator color={Colors.accentText} size="small" />
                : <Text style={styles.resendLink}>Resend code</Text>}
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
  container: { flex: 1, gap: 24, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40 },

  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.uiSm, color: Colors.text3 },

  header: { alignItems: 'center', gap: 14, paddingTop: 16 },
  iconWrap: {
    alignItems: 'center', backgroundColor: Colors.accentSoft, borderColor: '#1A4A40',
    borderRadius: Radius.xl, borderWidth: 1, height: 72, justifyContent: 'center', width: 72,
  },
  iconEmoji: { fontSize: 32 },
  title: { ...Typography.h1, color: Colors.text0, textAlign: 'center' },
  sub: { ...Typography.body, color: Colors.text2, textAlign: 'center', lineHeight: 24 },
  emailHighlight: { color: Colors.accentText, fontWeight: '700' },

  // OTP
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  otpBox: {
    alignItems: 'center', backgroundColor: Colors.bg4, borderColor: Colors.border1,
    borderRadius: Radius.md, borderWidth: 1.5, height: 60, justifyContent: 'center',
    position: 'relative', width: 48,
  },
  otpBoxActive: { borderColor: Colors.accent },
  otpBoxFilled: { backgroundColor: Colors.accentDim, borderColor: '#2DD4BF' },
  otpChar: { color: Colors.text0, fontSize: 24, fontWeight: '800' },
  cursor: {
    backgroundColor: Colors.accent, borderRadius: 1,
    bottom: 10, height: 2, position: 'absolute', width: 20,
  },
  hiddenInput: { height: 1, opacity: 0, position: 'absolute', width: 1 },

  errorBox: {
    alignItems: 'flex-start', backgroundColor: '#1C0000', borderColor: '#4C0519',
    borderRadius: Radius.sm, borderWidth: 1, flexDirection: 'row', gap: 8, padding: Spacing.md,
  },
  errorDot: { color: Colors.danger, fontSize: 10, marginTop: 3 },
  errorMsg: { ...Typography.bodySm, color: Colors.danger, flex: 1 },
  messageBox: {
    backgroundColor: Colors.accentDim, borderColor: '#1A4A40',
    borderRadius: Radius.sm, borderWidth: 1, padding: Spacing.md,
  },
  messageMsg: { ...Typography.bodySm, color: Colors.accentText, textAlign: 'center' },

  cta: {
    alignItems: 'center', backgroundColor: Colors.accent, borderRadius: Radius.md,
    elevation: 8, height: 54, justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16,
  },
  ctaDisabled: { opacity: 0.45, shadowOpacity: 0 },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.975 }] },
  ctaText: { color: Colors.bg0, fontSize: 16, fontWeight: '800' },

  resendRow: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center' },
  resendLabel: { ...Typography.bodySm, color: Colors.text3 },
  resendLink: { ...Typography.bodySm, color: Colors.accentText, fontWeight: '700' },
});
