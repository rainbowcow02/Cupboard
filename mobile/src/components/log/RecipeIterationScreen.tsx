import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { createCup } from '../../lib/api';
import { ErrorBox } from '../ErrorBox';
import { PrimaryButton } from '../PrimaryButton';
import { TAB_BAR_HEIGHT } from '../TabBar';
import {
  BrewFieldSet,
  BrewFormValues,
  brewFieldsPayload,
  recipeValuesFrom,
} from './BrewFieldSet';

interface Props {
  coffee: Coffee;
  /** Recipe duplicated as the starting point, or null for a blank recipe. */
  base: Brew | null;
  onSaved: () => Promise<void>;
}

/**
 * Edit the recipe fields and log today's cup. Seeded from a duplicated base
 * brew (changed fields show a "was X" hint) or blank when starting fresh.
 */
export function RecipeIterationScreen({ coffee, base, onSaved }: Props) {
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

  const scrollBottomPad = Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 48;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
      keyboardShouldPersistTaps="handled"
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 4 },
  error: { marginBottom: 16 },
  save: { marginTop: 28 },
});
