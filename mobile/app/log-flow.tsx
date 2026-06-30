import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { AddViaLinkStep } from '../src/components/log/AddViaLinkStep';
import { NewBeanStep } from '../src/components/log/NewBeanStep';
import { RecipeIterationScreen } from '../src/components/log/RecipeIterationScreen';
import { SetRecipeScreen } from '../src/components/log/SetRecipeScreen';
import { useCoffees } from '../src/hooks/useCoffees';

/**
 * The "log a cup" flow, presented as a native modal (registered with
 * `presentation: 'modal'` in app/_layout.tsx) so it rises from the bottom and is
 * swipe-to-dismissable just like the coffee detail page.
 *
 * The flow's sub-steps live in local state — the in-progress draft bean and the
 * chosen base brew never leave this component, so only the *entry point* is passed
 * through navigation params:
 *   - `?mode=new`       → start a brand-new bean
 *   - `?coffeeId=<id>`  → set a recipe for an existing bean
 */
type Step =
  | { name: 'newBean' }
  | { name: 'addViaLink' }
  | { name: 'setRecipe'; coffee: Coffee }
  | { name: 'editRecipe'; coffee: Coffee; base: Brew | null };

export default function LogFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coffees, refresh } = useCoffees();
  const { mode, coffeeId } = useLocalSearchParams<{ mode?: string; coffeeId?: string }>();

  const initialCoffee = coffeeId ? coffees.find((c) => c.id === coffeeId) : undefined;
  // Bad/stale params (e.g. a coffee that no longer exists) — close the modal.
  const invalid = mode !== 'new' && !initialCoffee;

  const [step, setStep] = useState<Step>(() =>
    mode === 'new' || !initialCoffee
      ? { name: 'newBean' }
      : { name: 'setRecipe', coffee: initialCoffee },
  );

  useEffect(() => {
    if (invalid) router.back();
  }, [invalid, router]);

  // Root steps (the entry point) dismiss the modal; sub-steps step back in place.
  const goBack = useCallback(() => {
    switch (step.name) {
      case 'newBean':
      case 'setRecipe':
        router.back();
        break;
      case 'addViaLink':
        setStep({ name: 'newBean' });
        break;
      case 'editRecipe':
        setStep({ name: 'setRecipe', coffee: step.coffee });
        break;
    }
  }, [step, router]);

  const onSaved = useCallback(async () => {
    await refresh();
    router.back();
  }, [refresh, router]);

  const openBean = useCallback(
    (coffee: Coffee) =>
      router.push({
        pathname: '/coffee/[beanId]',
        // Carry the full draft so a not-yet-saved bean still renders its detail page.
        params: { beanId: coffee.id, draft: JSON.stringify(coffee) },
      }),
    [router],
  );

  if (invalid) return null;

  return (
    <GestureHandlerRootView style={styles.screen}>
      <BottomSheetModalProvider>
        <View style={styles.screen}>
          {step.name === 'newBean' && (
            <NewBeanStep
              bottomInset={insets.bottom}
              onBack={goBack}
              onContinue={(coffee) => setStep({ name: 'setRecipe', coffee })}
              onAddViaLink={() => setStep({ name: 'addViaLink' })}
            />
          )}

          {step.name === 'addViaLink' && (
            <AddViaLinkStep
              bottomInset={insets.bottom}
              onBack={goBack}
              onConfirm={(coffee) => setStep({ name: 'setRecipe', coffee })}
            />
          )}

          {step.name === 'setRecipe' && (
            <SetRecipeScreen
              coffee={step.coffee}
              onBack={goBack}
              onPickRecipe={(base) => setStep({ name: 'editRecipe', coffee: step.coffee, base })}
              onNew={() => setStep({ name: 'editRecipe', coffee: step.coffee, base: null })}
              onOpenBean={() => openBean(step.coffee)}
              onSaved={onSaved}
            />
          )}

          {step.name === 'editRecipe' && (
            <RecipeIterationScreen
              coffee={step.coffee}
              base={step.base}
              onBack={goBack}
              onOpenBean={() => openBean(step.coffee)}
              onSaved={onSaved}
            />
          )}
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.pearl },
});
