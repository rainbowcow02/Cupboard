import { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { BrewForm } from '../coffee/BrewForm';
import { BeanPickerStep } from '../../src/components/log/BeanPickerStep';
import { BrewLandingStep } from '../../src/components/log/BrewLandingStep';
import { LogHeader } from '../../src/components/log/LogHeader';
import { NewBeanStep } from '../../src/components/log/NewBeanStep';
import { QuickLogStep } from '../../src/components/log/QuickLogStep';
import { RecipeChoiceStep, RecipePath } from '../../src/components/log/RecipeChoiceStep';
import { RecipePickerStep } from '../../src/components/log/RecipePickerStep';
import { useCoffees } from '../../src/hooks/useCoffees';

type Step =
  | { name: 'landing' }
  | { name: 'pickExisting' }
  | { name: 'newBean' }
  | { name: 'choice'; coffee: Coffee }
  | { name: 'pickRecipe'; coffee: Coffee; path: 'repeat' | 'tweak' }
  | { name: 'quickLog'; coffee: Coffee; template: Brew }
  | { name: 'brewForm'; coffee: Coffee; template: Brew | null };

function titleFor(step: Step): { title?: string; subtitle?: string } {
  switch (step.name) {
    case 'landing':
      return {};
    case 'pickExisting':
      return { title: 'Choose a coffee' };
    case 'newBean':
      return { title: 'New coffee', subtitle: 'Add it to your cupboard' };
    case 'choice':
      return { title: step.coffee.bean, subtitle: step.coffee.roaster };
    case 'pickRecipe':
      return {
        title: step.path === 'repeat' ? 'Pick a recipe' : 'Choose a starting point',
        subtitle: step.coffee.bean,
      };
    case 'quickLog':
      return { title: 'Log this cup', subtitle: step.coffee.bean };
    case 'brewForm':
      return {
        title: step.template ? 'Tweak recipe' : 'New recipe',
        subtitle: step.coffee.bean,
      };
  }
}

export default function LogScreen() {
  const { coffees, refresh } = useCoffees();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>({ name: 'landing' });

  const reset = useCallback(() => setStep({ name: 'landing' }), []);

  const onSavedAndReset = useCallback(async () => {
    await refresh();
    reset();
  }, [refresh, reset]);

  const goBack = useCallback(() => {
    setStep((current) => {
      switch (current.name) {
        case 'landing':
          return current;
        case 'pickExisting':
          return { name: 'landing' };
        case 'newBean':
          return { name: 'landing' };
        case 'choice':
          return { name: 'pickExisting' };
        case 'pickRecipe':
          return { name: 'choice', coffee: current.coffee };
        case 'quickLog':
          return { name: 'pickRecipe', coffee: current.coffee, path: 'repeat' };
        case 'brewForm':
          return current.coffee.brews.length > 0
            ? { name: 'choice', coffee: current.coffee }
            : { name: 'landing' };
      }
    });
  }, []);

  const onSelectCoffee = useCallback((coffee: Coffee) => {
    if (coffee.brews.length > 0) {
      setStep({ name: 'choice', coffee });
    } else {
      setStep({ name: 'brewForm', coffee, template: null });
    }
  }, []);

  const onChoosePath = useCallback((coffee: Coffee, path: RecipePath) => {
    if (path === 'new') {
      setStep({ name: 'brewForm', coffee, template: null });
    } else {
      setStep({ name: 'pickRecipe', coffee, path });
    }
  }, []);

  const onPickRecipe = useCallback(
    (coffee: Coffee, path: 'repeat' | 'tweak', brew: Brew) => {
      if (path === 'repeat') {
        setStep({ name: 'quickLog', coffee, template: brew });
      } else {
        setStep({ name: 'brewForm', coffee, template: brew });
      }
    },
    [],
  );

  const { title, subtitle } = titleFor(step);

  return (
    <SafeAreaView style={styles.container}>
      <LogHeader
        title={title}
        subtitle={subtitle}
        onBack={step.name === 'landing' ? undefined : goBack}
      />

      {step.name === 'landing' && (
        <BrewLandingStep
          coffeeCount={coffees.length}
          onSelectExisting={() => setStep({ name: 'pickExisting' })}
          onAddNew={() => setStep({ name: 'newBean' })}
        />
      )}

      {step.name === 'pickExisting' && (
        <BeanPickerStep
          coffees={coffees}
          bottomInset={insets.bottom}
          onSelectCoffee={onSelectCoffee}
        />
      )}

      {step.name === 'newBean' && (
        <NewBeanStep
          bottomInset={insets.bottom}
          onContinue={(coffee) => setStep({ name: 'brewForm', coffee, template: null })}
        />
      )}

      {step.name === 'choice' && (
        <RecipeChoiceStep
          coffee={step.coffee}
          bottomInset={insets.bottom}
          onChoose={(path) => onChoosePath(step.coffee, path)}
        />
      )}

      {step.name === 'pickRecipe' && (
        <RecipePickerStep
          brews={step.coffee.brews}
          bottomInset={insets.bottom}
          onSelect={(brew) => onPickRecipe(step.coffee, step.path, brew)}
        />
      )}

      {step.name === 'quickLog' && (
        <QuickLogStep
          coffee={step.coffee}
          template={step.template}
          bottomInset={insets.bottom}
          onSaved={onSavedAndReset}
        />
      )}

      {step.name === 'brewForm' && (
        <BrewForm
          coffee={step.coffee}
          templateBrew={step.template}
          embedded
          onClose={goBack}
          onSaved={onSavedAndReset}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pearl },
});
