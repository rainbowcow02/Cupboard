import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DMSerifDisplay_400Regular, useFonts } from '@expo-google-fonts/dm-serif-display';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SheetProviderLayoutSync } from '../src/components/surfaces/SheetLayoutHeightSync';
import { CoffeesContext, useCoffeesProvider } from '../src/hooks/useCoffees';

function CoffeesProvider({ children }: { children: React.ReactNode }) {
  const state = useCoffeesProvider();
  return <CoffeesContext.Provider value={state}>{children}</CoffeesContext.Provider>;
}

export default function RootLayout() {
  const [loaded] = useFonts({ DMSerifDisplay_400Regular });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <CoffeesProvider>
          <BottomSheetModalProvider>
            {/*
              Pins the root sheet container to the device height. Native page
              sheets scale the presenter and leave gorhom's one-shot onLayout
              short; without this, detached Home sheets float above the tab bar.
              Do not copy into bean detail / log-flow — those have their own
              providers that must measure the page sheet, not the window.
            */}
            <SheetProviderLayoutSync />
            {/*
              `pageSheet`, not `modal`, on purpose. iOS 18 remapped
              `UIModalPresentationAutomatic` — which is what react-native-screens
              uses for `modal` — from page sheet to *form sheet*, and a form sheet
              does not scale its presenter. That's why these used to slide up over
              a flat, full-size tab screen instead of the native card stack.
              `pageSheet` sets `UIModalPresentationPageSheet` explicitly, which
              restores the scale-back. See react-native-screens#2793.
            */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="coffee/[beanId]"
                options={{ presentation: 'pageSheet', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="log-flow"
                options={{ presentation: 'pageSheet', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </BottomSheetModalProvider>
        </CoffeesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
