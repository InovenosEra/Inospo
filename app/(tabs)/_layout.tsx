import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Array<{
  name: string;
  title: string;
  icon: IconName;
  iconFocused: IconName;
}> = [
  { name: 'index', title: 'Matches', icon: 'football-outline', iconFocused: 'football' },
  { name: 'stats', title: 'Stats', icon: 'bar-chart-outline', iconFocused: 'bar-chart' },
  { name: 'news', title: 'News', icon: 'newspaper-outline', iconFocused: 'newspaper' },
  { name: 'picks', title: 'My Picks', icon: 'checkmark-circle-outline', iconFocused: 'checkmark-circle' },
  { name: 'leaderboard', title: 'Rankings', icon: 'trophy-outline', iconFocused: 'trophy' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 56 + (Platform.OS === 'ios' ? insets.bottom : Spacing.sm),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : Spacing.sm,
          paddingTop: Spacing.sm,
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
