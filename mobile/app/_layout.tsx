import { DMSerifDisplay_400Regular, useFonts } from '@expo-google-fonts/dm-serif-display';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="coffee/[id]"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>
        </CoffeesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
