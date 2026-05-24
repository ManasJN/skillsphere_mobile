/**
 * Tab layout — Phase 8 (final device compatibility fix)
 *
 * ROOT CAUSE OF PERSISTENT ICON CLIPPING:
 * @react-navigation/bottom-tabs v7 applies safe area insets to the tab bar
 * AUTOMATICALLY via its internal SafeAreaInsetsContext. When we ALSO manually
 * compute `tabBarHeight = baseHeight + bottomInset` and set `paddingBottom:
 * bottomInset`, the inset is applied TWICE:
 *   – once by our manual height math
 *   – once by React Navigation internally
 * On Android with edgeToEdgeEnabled:true and a 48px gesture bar, this pushes
 * icons 48px above where they should be. On devices without a gesture bar,
 * the redundant padding just wastes space.
 *
 * THE FIX:
 * Remove all manual inset/height calculation from tabBarStyle.
 * Let React Navigation handle bottom safe area completely.
 * Only set visual properties: backgroundColor, border, elevation, paddingTop.
 * Use tabBarItemStyle for consistent icon centering.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs }   from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Colors, Radius, Typography } from '@/lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TABS = [
  { name: 'index',         title: 'Home',    icon: 'home',          iconOut: 'home-outline'          },
  { name: 'goals',         title: 'Goals',   icon: 'checkbox',      iconOut: 'checkbox-outline'      },
  { name: 'opportunities', title: 'Explore', icon: 'compass',       iconOut: 'compass-outline'       },
  { name: 'leaderboard',   title: 'Rank',    icon: 'podium',        iconOut: 'podium-outline'        },
  { name: 'profile',       title: 'Profile', icon: 'person-circle', iconOut: 'person-circle-outline' },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.text3,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          ...Typography.label,
          // Override the uppercase + tracking from Typography.label
          textTransform: 'none',
          letterSpacing: 0.1,
          fontSize: 10,
          marginTop: 0,
          // Android needs explicit bottom margin so label doesn't sit
          // flush against the gesture bar when inset is large
          marginBottom: Platform.OS === 'android' ? 2 : 0,
        },
        tabBarStyle: S.tabBar,
        // tabBarItemStyle controls each icon+label cell's layout
        tabBarItemStyle: S.tabBarItem,
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
      {/* Notifications: reachable via router.push, hidden from tab bar */}
      <Tabs.Screen
        name="notifications"
        options={{ href: null }}
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
  tabBar: {
    backgroundColor: Colors.bg2,
    borderTopWidth: 1,
    borderTopColor: Colors.border1,
    // elevation MUST be > 0 on Android with edgeToEdgeEnabled:true
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    // NO height, NO paddingBottom — React Navigation applies safe area insets
    // automatically in bottom-tabs v7. Setting them here causes double-inset.
    paddingTop: 6,
  },
  tabBarItem: {
    // Ensure icon+label are vertically centred within the cell.
    // This is the correct place to control item-level layout.
    paddingTop: 4,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 3,
  },
  iconWrapActive: {
    backgroundColor: Colors.accentDim,
  },
});
