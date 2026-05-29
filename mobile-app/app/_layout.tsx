/**
 * Root layout — navigation shell.
 *
 * initialRouteName is now blank — the root index.tsx auth gate
 * handles all initial routing. We still register all screens so
 * Expo Router's type system knows about them.
 */

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack }        from 'expo-router';
import { StatusBar }    from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/lib/theme';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background:   Colors.bg1,
    card:         Colors.bg2,
    border:       Colors.border1,
    primary:      Colors.accent,
    notification: Colors.warning,
    text:         Colors.text0,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: Colors.bg1 },
          }}>
          {/* Auth gate — renders first, redirects immediately */}
          <Stack.Screen name="index"           options={{ animation: 'none' }} />

          {/* Auth screens */}
          <Stack.Screen name="login"           options={{ animation: 'fade' }} />
          <Stack.Screen name="register"        options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="otp-verification" options={{ animation: 'slide_from_right' }} />

          {/* Main app */}
          <Stack.Screen name="(tabs)"          options={{ animation: 'none' }} />

          {/* Portfolio system */}
          <Stack.Screen name="portfolio"       options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="share"           options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <StatusBar style="light" backgroundColor={Colors.bg1} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
