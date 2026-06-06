/**
 * Root layout — navigation shell.
 *
 * initialRouteName is now blank — the root index.tsx auth gate
 * handles all initial routing. We still register all screens so
 * Expo Router's type system knows about them.
 */

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack }        from 'expo-router';
import { StatusBar }    from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppThemeProvider, Colors, useAppTheme } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { isDark, mode } = useAppTheme();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      background:   Colors.bg1,
      card:         Colors.bg2,
      border:       Colors.border1,
      primary:      Colors.accent,
      notification: Colors.warning,
      text:         Colors.text0,
    },
  };

  return (
      <NavigationThemeProvider value={theme}>
        <Stack
          key={mode}
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

          {/* Main app — student side */}
          <Stack.Screen name="(tabs)"          options={{ animation: 'none' }} />

          {/* Main app — faculty/college side */}
          <Stack.Screen name="(faculty-tabs)"  options={{ animation: 'none' }} />
          <Stack.Screen name="faculty-student/[id]" options={{ animation: 'slide_from_right' }} />

          {/* Portfolio system */}
          <Stack.Screen name="portfolio"       options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="share"           options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={Colors.bg1} />
      </NavigationThemeProvider>
  );
}
