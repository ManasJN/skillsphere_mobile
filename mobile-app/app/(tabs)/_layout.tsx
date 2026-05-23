import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius } from '@/lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Goals replaces notifications as a primary tab.
// Notifications moves to the home screen header (more realistic pattern —
// inbox is secondary, goals are primary).
const TABS = [
  { name: 'index',         title: 'Home',    icon: 'home',          iconOut: 'home-outline'          },
  { name: 'goals',         title: 'Goals',   icon: 'checkmark-done',iconOut: 'checkmark-done-outline' },
  { name: 'opportunities', title: 'Explore', icon: 'compass',       iconOut: 'compass-outline'        },
  { name: 'leaderboard',   title: 'Rank',    icon: 'podium',        iconOut: 'podium-outline'         },
  { name: 'profile',       title: 'Profile', icon: 'person-circle', iconOut: 'person-circle-outline'  },
] as const;

export default function TabLayout() {
  const insets     = useSafeAreaInsets();
  const safeBottom = Math.max(0, insets.bottom);
  const tabBarHeight = 56 + safeBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.text3,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: tabBarHeight,
          paddingBottom: safeBottom,
          paddingTop: 0,
          backgroundColor: Colors.bg2,
          borderTopWidth: 1,
          borderTopColor: Colors.border1,
          elevation: 0,
          shadowOpacity: 0,
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
      {/* Keep notifications registered so deep links don't break */}
      <Tabs.Screen
        name="notifications"
        options={{ href: null }}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  iconWrapActive: {
    backgroundColor: Colors.accentDim,
  },
});
