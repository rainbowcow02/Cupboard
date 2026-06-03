import { Tabs } from 'expo-router';
import TabBar from '../../src/components/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home' }}    />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="log"     options={{ title: 'Log Cup' }} />
      <Tabs.Screen name="beans"   options={{ title: 'Beans' }}   />
    </Tabs>
  );
}
