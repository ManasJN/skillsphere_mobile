import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius } from '@/lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TABS = [
  { name: 'index',         title: 'Home',    icon: 'home',          iconOut: 'home-outline' },
  { name: 'leaderboard',   title: 'Rank',    icon: 'trophy',        iconOut: 'trophy-outline' },
  { name: 'opportunities', title: 'Explore', icon: 'briefcase',     iconOut: 'briefcase-outline' },
  { name: 'notifications', title: 'Inbox',   icon: 'notifications', iconOut: 'notifications-outline' },
  { name: 'profile',       title: 'Me',      icon: 'person-circle', iconOut: 'person-circle-outline' },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(8, insets.bottom);
  const tabBarHeight = (Platform.OS === 'android' ? 64 : 76) + bottomInset;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.text3,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 10,
          height: tabBarHeight,
          paddingBottom: bottomInset + 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          backgroundColor: Colors.bg2,
          borderRadius: 16,
          borderTopWidth: 0,
          borderColor: 'transparent',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
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
    </Tabs>
  );
}

function TabIcon({ name, color, focused }: { name: IoniconName; color: string; focused: boolean }) {
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
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  iconWrapActive: {
    backgroundColor: Colors.accentDim,
  },
});
