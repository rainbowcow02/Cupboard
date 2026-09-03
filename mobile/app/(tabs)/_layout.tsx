import { Tabs } from 'expo-router';
import { colors } from '@shared/theme';
import TabBar from '../../src/components/TabBar';
import { usePinSheetContainerOnFocus } from '../../src/components/surfaces/SheetLayoutHeightSync';

export default function TabLayout() {
  usePinSheetContainerOnFocus();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // The TabBar is a floating overlay (absolutely positioned; screens pad
      // themselves by TAB_BAR_HEIGHT). Marking the bar absolute stops the
      // navigator from reserving a strip for it, so scenes — and the detached
      // bottom sheets anchored to them — span the full screen and cover the bar.
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colors.transparent,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home' }}    />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="log"     options={{ title: 'Log Cup' }} />
      <Tabs.Screen name="beans"   options={{ title: 'Beans' }}   />
    </Tabs>
  );
}
