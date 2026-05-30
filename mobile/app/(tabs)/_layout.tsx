import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';
import { colors } from '@shared/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.pearl,
          borderTopColor: colors.greyLight,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: colors.moss,
        tabBarInactiveTintColor: colors.greyDark,
        tabBarLabelStyle: {
          fontFamily: 'Avenir',
          fontSize: 10,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cupboard',
          tabBarIcon: ({ color }) => <TabIcon name="shelf" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <TabIcon name="pin" color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <TabIcon name="mug" color={color} />,
        }}
      />
      <Tabs.Screen
        name="beans"
        options={{
          title: 'Beans',
          tabBarIcon: ({ color }) => <TabIcon name="bean" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: ColorValue }) {
  const icons: Record<string, string> = {
    shelf: '🗂',
    pin: '📍',
    mug: '☕',
    bean: '🫘',
  };
  return <Text style={{ fontSize: 18, opacity: color === colors.moss ? 1 : 0.5 }}>{icons[name]}</Text>;
}
