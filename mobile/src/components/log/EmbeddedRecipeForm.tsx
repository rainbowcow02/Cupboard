import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Coffee } from '@shared/lib/coffees';
import { createCup } from '../../lib/api';
import { ErrorBox } from '../ErrorBox';
import { PrimaryButton } from '../PrimaryButton';
import {
  BrewFieldSet,
  BrewFormValues,
  brewFieldsPayload,
  recipeValuesFrom,
} from './BrewFieldSet';

interface Props {
  coffee: Coffee;
  onSaved: () => Promise<void>;
}

/**
 * Blank recipe form embedded inline on SetRecipeScreen for beans that have no
 * brews yet (e.g. straight after adding a new bean). Same save path as
 * RecipeIterationScreen, minus the full-screen scaffold and back chrome.
 */
export function EmbeddedRecipeForm({ coffee, onSaved }: Props) {
  const [form, setForm] = useState<BrewFormValues>(() => recipeValuesFrom(null));
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
    <View>
      {error ? <ErrorBox message={error} style={styles.error} /> : null}

      <BrewFieldSet
        values={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      />

      <PrimaryButton
        label="Log this cup"
        busyLabel="Saving…"
        busy={saving}
        onPress={save}
        style={styles.save}
        accessibilityLabel="Log this cup"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  error: { marginBottom: 16 },
  save: { marginTop: 28 },
});
