import { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { AddViaLinkStep } from '../../src/components/log/AddViaLinkStep';
import { LogHeader } from '../../src/components/log/LogHeader';
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

function titleFor(step: Step): { title?: string; subtitle?: string } {
  switch (step.name) {
    case 'logHome':
    case 'setRecipe':
      return {};
    case 'newBean':
      return { title: 'New coffee', subtitle: 'Add it to your cupboard' };
    case 'addViaLink':
      return { title: 'Add from a link' };
    case 'editRecipe':
      return { title: step.coffee.bean, subtitle: step.coffee.roaster };
  }
}

export default function LogScreen() {
  const { coffees, refresh } = useCoffees();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>({ name: 'logHome' });

  const reset = useCallback(() => setStep({ name: 'logHome' }), []);

  const onSavedAndReset = useCallback(async () => {
    await refresh();
    reset();
  }, [refresh, reset]);

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

  const { title, subtitle } = titleFor(step);

  // setRecipe renders its own header (left-aligned title + "New" action).
  const showLogHeader = step.name !== 'logHome' && step.name !== 'setRecipe';

  return (
    <SafeAreaView style={styles.container}>
      {/* logHome renders its own scrim so the floating search bar can sit above it. */}
      {step.name !== 'logHome' && <BottomChromeScrim />}
      {showLogHeader ? (
        <LogHeader title={title} subtitle={subtitle} onBack={goBack} />
      ) : null}

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
          onContinue={(coffee) => setStep({ name: 'setRecipe', coffee })}
          onAddViaLink={() => setStep({ name: 'addViaLink' })}
        />
      )}

      {step.name === 'addViaLink' && (
        <AddViaLinkStep
          bottomInset={insets.bottom}
          onConfirm={(coffee) => setStep({ name: 'setRecipe', coffee })}
        />
      )}

      {step.name === 'setRecipe' && (
        <SetRecipeScreen
          coffee={step.coffee}
          onBack={goBack}
          onPickRecipe={(base) => setStep({ name: 'editRecipe', coffee: step.coffee, base })}
          onNew={() => setStep({ name: 'editRecipe', coffee: step.coffee, base: null })}
        />
      )}

      {step.name === 'editRecipe' && (
        <RecipeIterationScreen
          coffee={step.coffee}
          base={step.base}
          onSaved={onSavedAndReset}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pearl },
});
