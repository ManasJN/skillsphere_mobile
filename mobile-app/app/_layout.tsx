import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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
        <Stack initialRouteName="login" screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="login"            options={{ headerShown: false }} />
          <Stack.Screen name="register"         options={{ headerShown: false }} />
          <Stack.Screen name="otp-verification" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"           options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" backgroundColor={Colors.bg1} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
