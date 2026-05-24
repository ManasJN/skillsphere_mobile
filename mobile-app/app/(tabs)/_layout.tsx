/**
 * Tab layout — Phase 6 fix
 *
 * Root causes of invisible icons fixed:
 *  1. elevation:0 + edgeToEdgeEnabled:true → tab bar invisible on Android.
 *     Restored elevation:8 so the bar renders above the system nav bar.
 *  2. tabBarHeight collapsed to 56px on devices with safeBottom=0.
 *     Platform-aware minimum: Android 64px, iOS 72px + safe inset.
 *  3. tabBarShowLabel:false removed — labels are critical for new user
 *     discoverability. Small labels, proper spacing.
 *  4. 'checkmark-done-outline' doesn't exist in Ionicons v7 → renders blank.
 *     Replaced with 'checkbox-outline' / 'checkbox'.
 *  5. bottom:0 flush on Android edge-to-edge clips the bar.
 *     Restored appropriate bottom positioning.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Typography } from '@/lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TABS = [
  { name: 'index',         title: 'Home',    icon: 'home',           iconOut: 'home-outline'           },
  { name: 'goals',         title: 'Goals',   icon: 'checkbox',       iconOut: 'checkbox-outline'       },
  { name: 'opportunities', title: 'Explore', icon: 'compass',        iconOut: 'compass-outline'        },
  { name: 'leaderboard',   title: 'Rank',    icon: 'podium',         iconOut: 'podium-outline'         },
  { name: 'profile',       title: 'Profile', icon: 'person-circle',  iconOut: 'person-circle-outline'  },
] as const;

export default function TabLayout() {
  const insets      = useSafeAreaInsets();
  // Minimum bottom inset: 8px so icons never touch the screen edge
  const bottomInset = Math.max(8, insets.bottom);
  // Platform-aware height: Android needs more room due to edge-to-edge gesture bar
  const tabBarHeight = (Platform.OS === 'android' ? 64 : 72) + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.text3,
        // Show labels — they help new users understand tabs
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          marginBottom: Platform.OS === 'android' ? 4 : 2,
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          backgroundColor: Colors.bg2,
          borderTopWidth: 1,
          borderTopColor: Colors.border1,
          // elevation MUST be > 0 on Android with edgeToEdgeEnabled:true
          // or the bar renders beneath the system navigation bar
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        },
      }}>
      {TABS.map(({ name, title, icon, iconOut }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name={(focused ? icon : iconOut) as IoniconName}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      ))}
      {/* Notifications: hidden from tab bar, reachable via router.push */}
      <Tabs.Screen
        name="notifications"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}

function TabIcon({
  name, color, focused,
}: { name: IoniconName; color: string; focused: boolean }) {
  return (
    <View style={[S.iconWrap, focused && S.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

const S = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  iconWrapActive: {
    backgroundColor: Colors.accentDim,
  },
});
