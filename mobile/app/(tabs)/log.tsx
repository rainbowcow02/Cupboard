import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Coffee } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { LogHomeScreen } from '../../src/components/log/LogHomeScreen';
import { useCoffees } from '../../src/hooks/useCoffees';

/**
 * Log tab: the cupboard list. Tapping a bean or "Add" opens the logging flow as a
 * native modal (app/log-flow.tsx) that rises over this list and is swipe-dismissable.
 */
export default function LogScreen() {
  const { coffees } = useCoffees();
  const router = useRouter();

  const openRecipe = (coffee: Coffee) =>
    router.push({ pathname: '/log-flow', params: { coffeeId: coffee.id } });

  const addNew = () => router.push({ pathname: '/log-flow', params: { mode: 'new' } });

  return (
    <SafeAreaView style={styles.container}>
      <LogHomeScreen coffees={coffees} onSelectCoffee={openRecipe} onAddNew={addNew} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pearl },
});
