import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { AddViaLinkStep } from '../../src/components/log/AddViaLinkStep';
import { LogHomeScreen } from '../../src/components/log/LogHomeScreen';
import { NewBeanStep } from '../../src/components/log/NewBeanStep';
import { RecipeIterationScreen } from '../../src/components/log/RecipeIterationScreen';
import { SetRecipeScreen } from '../../src/components/log/SetRecipeScreen';
import { BottomChromeScrim } from '../../src/components/surfaces/BottomChromeScrim';
import { useCoffees } from '../../src/hooks/useCoffees';

type Step =
  | { name: 'logHome' }
  | { name: 'newBean' }
  | { name: 'addViaLink' }
  | { name: 'setRecipe'; coffee: Coffee }
  | { name: 'editRecipe'; coffee: Coffee; base: Brew | null };

export default function LogScreen() {
  const { coffees, refresh } = useCoffees();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>({ name: 'logHome' });

  const reset = useCallback(() => setStep({ name: 'logHome' }), []);

  const onSavedAndReset = useCallback(async () => {
    await refresh();
    reset();
  }, [refresh, reset]);

  const openBean = useCallback(
    (coffee: Coffee) =>
      router.push({
        pathname: '/coffee/[beanId]',
        // Carry the full draft so a not-yet-saved bean still renders its detail page.
        params: { beanId: coffee.id, draft: JSON.stringify(coffee) },
      }),
    [router],
  );

  const goBack = useCallback(() => {
    setStep((current) => {
      switch (current.name) {
        case 'logHome':
          return current;
        case 'newBean':
          return { name: 'logHome' };
        case 'addViaLink':
          return { name: 'newBean' };
        case 'setRecipe':
          return { name: 'logHome' };
        case 'editRecipe':
          return { name: 'setRecipe', coffee: current.coffee };
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* logHome renders its own scrim so the floating search bar can sit above it. */}
      {step.name !== 'logHome' && <BottomChromeScrim />}

      {step.name === 'logHome' && (
        <LogHomeScreen
          coffees={coffees}
          onSelectCoffee={(coffee) => setStep({ name: 'setRecipe', coffee })}
          onAddNew={() => setStep({ name: 'newBean' })}
        />
      )}

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
          onSaved={onSavedAndReset}
        />
      )}

      {step.name === 'editRecipe' && (
        <RecipeIterationScreen
          coffee={step.coffee}
          base={step.base}
          onBack={goBack}
          onOpenBean={() => openBean(step.coffee)}
          onSaved={onSavedAndReset}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pearl },
});
