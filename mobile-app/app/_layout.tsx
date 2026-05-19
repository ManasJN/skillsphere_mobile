import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { Colors } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG = [
  { name: 'index',         label: 'Home',         icon: 'home',                 iconOutline: 'home-outline' },
  { name: 'leaderboard',  label: 'Leaderboard',   icon: 'trophy',               iconOutline: 'trophy-outline' },
  { name: 'notifications',label: 'Inbox',         icon: 'notifications',        iconOutline: 'notifications-outline' },
  { name: 'profile',      label: 'Profile',       icon: 'person-circle',        iconOutline: 'person-circle-outline' },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.text3,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: Colors.bg2,
          borderTopColor: Colors.border0,
          borderTopWidth: 1,
          height: 74,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarIconStyle: { marginTop: 2 },
      }}>
      {TAB_CONFIG.map(({ name, label, icon, iconOutline }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                color={color}
                name={(focused ? icon : iconOutline) as IconName}
                size={24}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
