import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { useCoffees } from '../../hooks/useCoffees';
import { ComboBoxField } from '../ComboBoxField';
import { FormField, fieldInputStyle } from '../FormField';

/** The editable bean-detail fields shared by the new-bean and edit-bean forms. */
export interface NewBeanDraft {
  bean: string;
  roaster: string;
  origin: string;
  process: string;
  roastLevel: string;
  region: string;
  variety: string;
  altitude: string;
  notes: string;
}

export const blankBeanDraft: NewBeanDraft = {
  bean: '',
  roaster: '',
  origin: '',
  process: '',
  roastLevel: '',
  region: '',
  variety: '',
  altitude: '',
  notes: '',
};

/** Pre-fill a draft from a persisted coffee, coercing missing fields to ''. */
export function draftFromCoffee(coffee: Coffee): NewBeanDraft {
  return {
    bean: coffee.bean ?? '',
    roaster: coffee.roaster ?? '',
    origin: coffee.origin ?? '',
    process: coffee.process ?? '',
    roastLevel: coffee.roastLevel ?? '',
    region: coffee.region ?? '',
    variety: coffee.variety ?? '',
    altitude: coffee.altitude ?? '',
    notes: coffee.notes ?? '',
  };
}

/** Distinct, non-empty values for a coffee field, sorted A–Z. */
function distinctValues(coffees: Coffee[], field: keyof Coffee): string[] {
  const seen = new Set<string>();
  for (const coffee of coffees) {
    const raw = coffee[field];
    if (typeof raw === 'string' && raw.trim()) seen.add(raw.trim());
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

interface Props {
  form: NewBeanDraft;
  set: (k: keyof NewBeanDraft) => (v: string) => void;
}

/**
 * The bean-detail form body: bean name, roaster, origin, process, roast, region,
 * variety and tasting notes. Combo-box fields suggest values already used across
 * the user's other coffees. Shared so the new-bean and edit-bean forms stay in sync.
 */
export function BeanFields({ form, set }: Props) {
  const { coffees } = useCoffees();

  const options = useMemo(
    () => ({
      roaster: distinctValues(coffees, 'roaster'),
      origin: distinctValues(coffees, 'origin'),
      process: distinctValues(coffees, 'process'),
      roastLevel: distinctValues(coffees, 'roastLevel'),
      region: distinctValues(coffees, 'region'),
      variety: distinctValues(coffees, 'variety'),
    }),
    [coffees],
  );

  // Variety is stored as a comma-joined string but edited as a multi-select list.
  const varietyList = form.variety
    ? form.variety.split(',').map((v) => v.trim()).filter(Boolean)
    : [];
  const setVariety = (list: string[]) => set('variety')(list.join(', '));

  return (
    <View style={styles.fields}>
      <FormField label="Bean" horizontal>
        <TextInput
          style={fieldInputStyle}
          value={form.bean}
          onChangeText={set('bean')}
          placeholder="Add bean name"
          placeholderTextColor={colors.greyDark}
          returnKeyType="next"
        />
      </FormField>
      <FormField label="Roaster" horizontal>
        <ComboBoxField
          label="Roaster"
          value={form.roaster}
          options={options.roaster}
          placeholder="Who's the roaster?"
          onChange={set('roaster')}
        />
      </FormField>
      <FormField label="Country" horizontal>
        <ComboBoxField
          label="Country"
          value={form.origin}
          options={options.origin}
          placeholder="Where was it sourced?"
          onChange={set('origin')}
          flagFor={(option) => ORIGIN_FLAGS[option] || ''}
        />
      </FormField>
      <FormField label="Process" horizontal>
        <ComboBoxField
          label="Process"
          value={form.process}
          options={options.process}
          placeholder="How was it processed?"
          onChange={set('process')}
        />
      </FormField>
      <FormField label="Roast" horizontal>
        <ComboBoxField
          label="Roast"
          value={form.roastLevel}
          options={options.roastLevel}
          placeholder="What's the roast-level?"
          onChange={set('roastLevel')}
        />
      </FormField>
      <FormField label="Region" horizontal>
        <ComboBoxField
          label="Region"
          value={form.region}
          options={options.region}
          placeholder="Know the region?"
          onChange={set('region')}
        />
      </FormField>
      <FormField label="Variety" horizontal>
        <ComboBoxField
          label="Variety"
          multiple
          value={varietyList}
          options={options.variety}
          placeholder="Which varietal?"
          onChange={setVariety}
        />
      </FormField>
      <FormField label="Altitude" horizontal>
        <TextInput
          style={fieldInputStyle}
          value={form.altitude}
          onChangeText={set('altitude')}
          placeholder="e.g. 1,800 masl"
          placeholderTextColor={colors.greyDark}
          returnKeyType="next"
          accessibilityLabel="Altitude"
        />
      </FormField>
      <FormField label="Tasting notes" horizontal>
        <TextInput
          style={fieldInputStyle}
          value={form.notes}
          onChangeText={set('notes')}
          placeholder="e.g. Rose Tea, Oolong, Cantalope"
          placeholderTextColor={colors.greyDark}
          returnKeyType="done"
        />
      </FormField>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
});
