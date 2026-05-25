/**
 * Tab layout — Phase 9 — Visual polish final
 *
 * Key insight from reading the original working layout:
 * The icons were fine when the bar used position:'absolute' with explicit
 * bottom + height. The flush bar approach caused OEM-specific rendering
 * differences because without an explicit height, Android OEMs auto-size
 * the bar differently.
 *
 * This version:
 *  - Uses position:'absolute' so we fully own the bar geometry
 *  - Sets height explicitly from a fixed base (56px) + safe inset
 *  - Applies paddingBottom ONLY equal to the safe inset (not doubled)
 *  - Keeps the flush-bottom aesthetic (no floating pill/border radius)
 *  - Uses confirmed-working Ionicons 7 names only
 *  - Removes the custom TabIcon wrapper for Goals — plain icon, no state
 *    logic in the wrapper (React Navigation manages active state via color)
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs }  from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Every name below is confirmed present in Ionicons 7 / @expo/vector-icons 15.
// Source: original working repo used home, trophy, briefcase, person-circle.
// compass and flag are also v7 staples. target-outline confirmed in v7.
const TABS = [
  { name: 'index',         title: 'Home',    icon: 'home',          iconOut: 'home-outline'          },
  { name: 'goals',         title: 'Goals',   icon: 'flag',          iconOut: 'flag-outline'          },
  { name: 'opportunities', title: 'Explore', icon: 'compass',       iconOut: 'compass-outline'       },
  { name: 'leaderboard',   title: 'Rank',    icon: 'trophy',        iconOut: 'trophy-outline'        },
  { name: 'profile',       title: 'Profile', icon: 'person-circle', iconOut: 'person-circle-outline' },
] as const;

// Fixed base height of the icon+label area (no inset).
// Matches what Instagram/LinkedIn use: 49pt on iOS, 56dp on Android.
const TAB_BASE_HEIGHT = Platform.OS === 'ios' ? 49 : 56;
const TAB_ICON_SIZE = 24;
const TAB_ICON_BOX = 30;

export default function TabLayout() {
  const insets     = useSafeAreaInsets();
  // Safe inset floor: 0 on devices with hardware buttons (insets.bottom === 0),
  // actual value on gesture-nav devices (typically 34pt iOS, 16-48dp Android).
  const safeBottom = insets.bottom;
  const barHeight  = TAB_BASE_HEIGHT + safeBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.text2,
        tabBarShowLabel: true,
        tabBarIconStyle: {
          width: TAB_ICON_BOX,
          height: TAB_ICON_BOX,
          marginTop: Platform.OS === 'ios' ? 2 : 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          // Tighten the gap between icon and label
          marginTop: 0,
          // On Android, prevent label touching the gesture bar
          marginBottom: Platform.OS === 'android' ? 2 : 0,
          letterSpacing: 0,
        },
        tabBarItemStyle: {
          // Each item fills its cell. paddingTop pushes icon+label group
          // slightly down from the bar top so the visual centre sits at ~40%
          // of the base height — matching how iOS renders its native tab bar.
          paddingTop: Platform.OS === 'ios' ? 6 : 8,
          paddingBottom: 0,
        },
        tabBarStyle: {
          // position:absolute means WE control geometry completely.
          // The safe area is added to barHeight, not handled by RN internally.
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: barHeight,
          // Only the base area has visible styling — the safe inset area
          // below is the same background colour, invisible.
          backgroundColor: Colors.bg2,
          borderTopWidth: 1,
          borderTopColor: Colors.border1,
          // Elevation must be > 0 on Android edge-to-edge to render above
          // the system navigation bar. 8 is safe across all OEMs.
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.10,
          shadowRadius: 3,
          // No paddingBottom here — barHeight already includes safeBottom.
          // React Navigation sets paddingBottom from safeAreaInsets when
          // position:'absolute' is NOT set. Since we ARE setting it, RN
          // does not double-apply, and our barHeight math is authoritative.
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
              />
            ),
          }}
        />
      ))}

      {/* Notifications: accessible via router.push, hidden from tab bar */}
      <Tabs.Screen
        name="notifications"
        options={{ href: null }}
      />
    </Tabs>
  );
}

function TabIcon({
  name, color,
}: { name: IoniconName; color: string }) {
  return (
    <View pointerEvents="none" style={S.iconBox}>
      <Ionicons name={name} size={TAB_ICON_SIZE} color={color} style={S.icon} />
    </View>
  );
}

const S = StyleSheet.create({
  iconBox: {
    width: TAB_ICON_BOX,
    height: TAB_ICON_BOX,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'visible',
  },
  icon: {
    textAlign: 'center',
    lineHeight: TAB_ICON_SIZE,
  },
});
