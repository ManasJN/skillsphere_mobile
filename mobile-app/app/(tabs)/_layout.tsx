import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const skillSphereTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#080B12',
    border: '#1E293B',
    card: '#0F172A',
    notification: '#FBBF24',
    primary: '#5EEAD4',
    text: '#F8FAFC',
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={skillSphereTheme}>
      <Stack>
        {/* Root entry — handles auth redirect */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="otp-verification" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
