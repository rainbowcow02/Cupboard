import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { useCoffees } from '../../hooks/useCoffees';
import { ComboBoxField } from '../ComboBoxField';
import { DateField } from '../DateField';
import { FieldDiffHint } from '../FieldDiffHint';
import { FormField, fieldInputStyle } from '../FormField';
import { RatingInput } from '../RatingInput';

/** Orders numeric strings numerically (so "20" precedes "100"), text A–Z. */
function compareOptions(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = a.trim() !== '' && Number.isFinite(na);
  const bNum = b.trim() !== '' && Number.isFinite(nb);
  if (aNum && bNum) return na - nb;
  if (aNum) return -1;
  if (bNum) return 1;
  return a.localeCompare(b);
}

/** "92" → "92°C / 198°F" so the temp picker shows both scales (Celsius stays the stored value). */
function tempWithFahrenheit(celsius: string): string {
  const c = Number(celsius);
  if (celsius.trim() === '' || !Number.isFinite(c)) return celsius;
  const f = Math.round((c * 9) / 5 + 32);
  return `${celsius}°C / ${f}°F`;
}

/** Distinct, non-empty values for a brew field across every logged brew. */
function distinctBrewValues(coffees: Coffee[], field: keyof Brew): string[] {
  const seen = new Set<string>();
  for (const coffee of coffees) {
    for (const brew of coffee.brews) {
      const raw = brew[field];
      if (typeof raw === 'string' && raw.trim()) seen.add(raw.trim());
      else if (typeof raw === 'number' && Number.isFinite(raw)) seen.add(String(raw));
    }
  }
  return [...seen].sort(compareOptions);
}

/** In-memory form state for a brew recipe (numbers held as strings). */
export interface BrewFormValues {
  brewer: string;
  grinder: string;
  filter: string;
  grind: string;
  beansG: string;
  waterMl: string;
  tempC: string;
  recipeToTest: string;
  date: Date;
  rating: number;
}

/** Recipe fields seeded from a source brew; date/rating reset for a fresh cup. */
export function recipeValuesFrom(source: Brew | null | undefined): BrewFormValues {
  return {
    brewer: source?.brewer ?? '',
    grinder: source?.grinder ?? '',
    filter: source?.filter ?? '',
    grind: source?.grind ?? '',
    beansG: source?.beansG != null ? String(source.beansG) : '',
    waterMl: source?.waterMl != null ? String(source.waterMl) : '',
    tempC: source?.tempC != null ? String(source.tempC) : '',
    recipeToTest: source?.recipeToTest ?? '',
    date: new Date(),
    rating: 0,
  };
}

/** Maps form state to the `createCup`/`updateCup` brew payload. */
export function brewFieldsPayload(values: BrewFormValues) {
  return {
    brewer: values.brewer || undefined,
    grinder: values.grinder || undefined,
    filter: values.filter || undefined,
    grind: values.grind || undefined,
    beansG: values.beansG ? Number(values.beansG) : undefined,
    waterMl: values.waterMl ? Number(values.waterMl) : undefined,
    tempC: values.tempC ? Number(values.tempC) : undefined,
    recipeToTest: values.recipeToTest.trim() || undefined,
    date: values.date.toISOString().slice(0, 10),
    rating: values.rating || undefined,
  };
}

interface Props {
  values: BrewFormValues;
  onChange: (patch: Partial<BrewFormValues>) => void;
  /** When iterating on a base recipe, shows "was X" hints on changed fields. */
  base?: Brew | null;
}

/** Text fields whose handler accepts a string (excludes date/rating). */
type TextKey =
  | 'brewer'
  | 'grinder'
  | 'filter'
  | 'grind'
  | 'beansG'
  | 'waterMl'
  | 'tempC'
  | 'recipeToTest';

export function BrewFieldSet({ values, onChange, base }: Props) {
  const { coffees } = useCoffees();
  const set = (k: TextKey) => (v: string) => onChange({ [k]: v } as Partial<BrewFormValues>);

  // Picker options sourced from the user's own brew history (so the values they
  // always reach for are one tap away) plus a sensible range for numeric fields.
  const options = useMemo(
    () => ({
      brewer: distinctBrewValues(coffees, 'brewer'),
      grinder: distinctBrewValues(coffees, 'grinder'),
      filter: distinctBrewValues(coffees, 'filter'),
      grind: distinctBrewValues(coffees, 'grind'),
      beansG: distinctBrewValues(coffees, 'beansG'),
      waterMl: distinctBrewValues(coffees, 'waterMl'),
      tempC: distinctBrewValues(coffees, 'tempC'),
    }),
    [coffees],
  );

  // Raw compare value + display string (with unit) for each concise field.
  const baseDisplay = base
    ? {
        brewer: { raw: base.brewer ?? '', show: base.brewer ?? '' },
        grinder: { raw: base.grinder ?? '', show: base.grinder ?? '' },
        filter: { raw: base.filter ?? '', show: base.filter ?? '' },
        grind: { raw: base.grind ?? '', show: base.grind ?? '' },
        beansG: {
          raw: base.beansG != null ? String(base.beansG) : '',
          show: base.beansG != null ? `${base.beansG} g` : '',
        },
        waterMl: {
          raw: base.waterMl != null ? String(base.waterMl) : '',
          show: base.waterMl != null ? `${base.waterMl} ml` : '',
        },
        tempC: {
          raw: base.tempC != null ? String(base.tempC) : '',
          show: base.tempC != null ? tempWithFahrenheit(String(base.tempC)) : '',
        },
      }
    : null;

  const hintFor = (k: keyof NonNullable<typeof baseDisplay>): string | undefined => {
    if (!baseDisplay) return undefined;
    const { raw, show } = baseDisplay[k];
    return values[k] !== raw ? show : undefined;
  };

  return (
    <View style={styles.fields}>
      <FormField label="Brewer" horizontal>
        <ComboBoxField
          label="Brewer"
          value={values.brewer}
          options={options.brewer}
          placeholder="Pick a brewer"
          onChange={set('brewer')}
        />
        <FieldDiffHint previous={hintFor('brewer')} />
      </FormField>

      <FormField label="Filter" horizontal>
        <ComboBoxField
          label="Filter"
          value={values.filter}
          options={options.filter}
          placeholder="Pick a filter"
          onChange={set('filter')}
        />
        <FieldDiffHint previous={hintFor('filter')} />
      </FormField>

      <FormField label="Grinder" horizontal>
        <ComboBoxField
          label="Grinder"
          value={values.grinder}
          options={options.grinder}
          placeholder="Pick a grinder"
          onChange={set('grinder')}
        />
        <FieldDiffHint previous={hintFor('grinder')} />
      </FormField>

      <FormField label="Grind size" horizontal>
        <ComboBoxField
          label="Grind size"
          value={values.grind}
          options={options.grind}
          placeholder="Add grind size"
          keyboardType="decimal-pad"
          onChange={set('grind')}
        />
        <FieldDiffHint previous={hintFor('grind')} />
      </FormField>

      <FormField label="Beans (g)" horizontal>
        <ComboBoxField
          label="Beans (g)"
          value={values.beansG}
          options={options.beansG}
          placeholder="🫘"
          keyboardType="decimal-pad"
          onChange={set('beansG')}
        />
        <FieldDiffHint previous={hintFor('beansG')} />
      </FormField>

      <FormField label="Water (ml)" horizontal>
        <ComboBoxField
          label="Water (ml)"
          value={values.waterMl}
          options={options.waterMl}
          placeholder="💧"
          keyboardType="decimal-pad"
          onChange={set('waterMl')}
        />
        <FieldDiffHint previous={hintFor('waterMl')} />
      </FormField>

      <FormField label="Temperature" horizontal>
        <ComboBoxField
          label="Temp"
          value={values.tempC}
          options={options.tempC}
          formatOption={tempWithFahrenheit}
          placeholder="🔥"
          keyboardType="decimal-pad"
          onChange={set('tempC')}
        />
        <FieldDiffHint previous={hintFor('tempC')} />
      </FormField>

      <FormField label="Pour structure">
        {/* iOS truncates a multiline TextInput's native placeholder to one line,
            so render a wrapping Text overlay while the field is empty instead. */}
        <View style={styles.recipeInputWrap}>
          <TextInput
            style={[fieldInputStyle, styles.recipeInput]}
            value={values.recipeToTest}
            onChangeText={set('recipeToTest')}
            multiline
            textAlignVertical="top"
            returnKeyType="done"
          />
          {values.recipeToTest === '' && (
            <Text style={styles.recipePlaceholder} pointerEvents="none">
              Bloom 1 min → 50g, p1 → 100g, p2 → 150g, p3 → 200g, etc.
            </Text>
          )}
        </View>
      </FormField>

      <FormField label="Date" horizontal>
        <DateField
          value={values.date}
          onChange={(date) => onChange({ date })}
          style={styles.datePicker}
        />
      </FormField>

      <FormField label="Rating" horizontal>
        <View style={styles.ratingWrap}>
          <RatingInput value={values.rating} onChange={(rating) => onChange({ rating })} />
        </View>
      </FormField>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
  recipeInputWrap: { position: 'relative' },
  recipeInput: { minHeight: 96, paddingTop: 12 },
  recipePlaceholder: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 12,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    color: colors.greyDark,
    lineHeight: 20,
  },
  datePicker: { alignSelf: 'flex-start', marginTop: 2 },
  ratingWrap: { alignItems: 'flex-start' },
});
