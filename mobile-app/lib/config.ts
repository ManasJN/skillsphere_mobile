import Constants from 'expo-constants';

// Centralized API base URL — prefer environment variable, then Expo config extra,
// then fall back to localhost for development.
const envUrl = (process.env as any)?.EXPO_PUBLIC_API_URL
  ?? (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_API_URL
  ?? (Constants.manifest?.extra as any)?.EXPO_PUBLIC_API_URL;

if (!envUrl && __DEV__) {
  // Loud warning in dev so it's obvious the env var isn't set
  // and developer can set `EXPO_PUBLIC_API_URL` in a .env file or app config.
  // We fall back to localhost to avoid breaking builds during development.
  // Update this value when running on a physical device to your machine's LAN IP.
  // Example: EXPO_PUBLIC_API_URL=http://192.168.1.42:5000/api
  // (Do NOT hardcode IPs in source.)
  // eslint-disable-next-line no-console
  console.warn('[config] EXPO_PUBLIC_API_URL not set — falling back to http://localhost:5000/api');
}

export const API_BASE_URL = envUrl ?? 'http://localhost:5000/api';

export default { API_BASE_URL };
