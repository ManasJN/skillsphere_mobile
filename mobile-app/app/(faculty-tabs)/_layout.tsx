/**
 * app/(faculty-tabs)/_layout.tsx — Faculty tab navigator
 *
 * Phase 1 tabs: Dashboard · Students · Announcements · Profile
 * Mirrors the student tab layout's geometry and styling so both sides
 * feel part of the same app. Icon set follows the same Ionicons 7 rule.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Control, Shadow, Spacing, Typography } from '@/lib/theme';
import { useTabFocus } from '@/hooks/useAnimations';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const FACULTY_TABS = [
  { name: 'dashboard',     title: 'Dashboard',  icon: 'grid',          iconOut: 'grid-outline'          },
  { name: 'students',      title: 'Students',   icon: 'people',        iconOut: 'people-outline'        },
  { name: 'announcements', title: 'Posts',      icon: 'megaphone',     iconOut: 'megaphone-outline'     },
  { name: 'faculty-profile', title: 'Profile',  icon: 'person-circle', iconOut: 'person-circle-outline' },
] as const;

const TAB_BASE_HEIGHT = Platform.OS === 'ios' ? 50 : 56;
const TAB_ICON_SIZE   = Control.tabIcon;
const TAB_ICON_BOX    = Control.tabIconBox;

export default function FacultyTabLayout() {
  const insets     = useSafeAreaInsets();
  const safeBottom = insets.bottom;
  const barHeight  = TAB_BASE_HEIGHT + safeBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.accentLight,
        tabBarInactiveTintColor: Colors.text3,
        tabBarShowLabel: true,
        tabBarIconStyle: {
          width: TAB_ICON_BOX,
          height: TAB_ICON_BOX,
          marginTop: Platform.OS === 'ios' ? 2 : 4,
        },
        tabBarLabelStyle: {
          ...Typography.bodyXs,
          fontWeight: '600' as const,
          marginTop: 0,
          marginBottom: Platform.OS === 'android' ? Spacing.xxs : 0,
          letterSpacing: 0,
        },
        tabBarItemStyle: {
          paddingTop: Platform.OS === 'ios' ? Spacing.sm : Spacing.sm,
          paddingBottom: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: barHeight,
          backgroundColor: Colors.bg1,
          borderTopWidth: 1,
          borderTopColor: Colors.border0,
          ...Shadow.hairline,
        },
      }}>

      {FACULTY_TABS.map(({ name, title, icon, iconOut }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <FacultyTabIcon
                name={(focused ? icon : iconOut) as IoniconName}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

function FacultyTabIcon({
  name, color, focused,
}: { name: IoniconName; color: string; focused: boolean }) {
  const { scale, opacity } = useTabFocus(focused);
  return (
    <View pointerEvents="none" style={S.iconBox}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Ionicons name={name} size={TAB_ICON_SIZE} color={color} style={S.icon} />
      </Animated.View>
      {focused ? <View style={S.activeDot} /> : null}
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
  activeDot: {
    backgroundColor: Colors.accent,
    borderRadius: 2,
    bottom: -2,
    height: 3,
    position: 'absolute',
    width: 14,
  },
  icon: {
    textAlign: 'center',
    lineHeight: TAB_ICON_SIZE,
  },
});
