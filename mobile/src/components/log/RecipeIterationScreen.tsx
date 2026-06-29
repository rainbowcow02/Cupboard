import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { createCup } from '../../lib/api';
import { ErrorBox } from '../ErrorBox';
import { PrimaryButton } from '../PrimaryButton';
import {
  BrewFieldSet,
  BrewFormValues,
  brewFieldsPayload,
  recipeValuesFrom,
} from './BrewFieldSet';
import { LogFormScaffold } from './LogFormScaffold';

interface Props {
  coffee: Coffee;
  /** Recipe duplicated as the starting point, or null for a blank recipe. */
  base: Brew | null;
  onBack: () => void;
  onSaved: () => Promise<void>;
}

/**
 * Edit the recipe fields and log today's cup. Seeded from a duplicated base
 * brew (changed fields show a "was X" hint) or blank when starting fresh.
 */
export function RecipeIterationScreen({ coffee, base, onBack, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<BrewFormValues>(() => recipeValuesFrom(base));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await createCup({
        bean: coffee.bean,
        roaster: coffee.roaster,
        origin: coffee.origin,
        process: coffee.process,
        roastLevel: coffee.roastLevel,
        region: coffee.region,
        variety: coffee.variety,
        notes: coffee.notes,
        ...brewFieldsPayload(form),
      });
      await onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  };

  return (
    <LogFormScaffold
      onBack={onBack}
      title={coffee.bean}
      description={coffee.roaster}
      bottomInset={insets.bottom}
    >
      {error ? <ErrorBox message={error} style={styles.error} /> : null}

      <BrewFieldSet
        values={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        base={base}
      />

      <PrimaryButton
        label="Log this cup"
        busyLabel="Saving…"
        busy={saving}
        onPress={save}
        style={styles.save}
        accessibilityLabel="Log this cup"
      />
    </LogFormScaffold>
  );
}

const styles = StyleSheet.create({
  error: { marginBottom: 16 },
  save: { marginTop: 28 },
});
