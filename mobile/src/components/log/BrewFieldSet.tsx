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
import { CascadeItem } from './CascadeItem';

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

/** Formats a Celsius value (numeric string) as "94°C / 201°F"; passes through non-numeric input. */
function formatTemp(celsius: string): string {
  const c = Number(celsius);
  if (celsius.trim() === '' || !Number.isFinite(c)) return celsius;
  return `${celsius}°C / ${Math.round((c * 9) / 5 + 32)}°F`;
}

/** Coffee-to-water ratio ("1:N", whole number) from beans/water strings, or null if unset. */
function ratioOf(beansG: string, waterMl: string): string | null {
  const beans = Number(beansG);
  const water = Number(waterMl);
  if (!beansG.trim() || !waterMl.trim() || !(beans > 0) || !Number.isFinite(water)) return null;
  return `1:${Math.round(water / beans)}`;
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
          show: base.tempC != null ? formatTemp(String(base.tempC)) : '',
        },
      }
    : null;

  const hintFor = (k: keyof NonNullable<typeof baseDisplay>): string | undefined => {
    if (!baseDisplay) return undefined;
    const { raw, show } = baseDisplay[k];
    return values[k] !== raw ? show : undefined;
  };

  // Coffee-to-water ratio (1:N) derived from the beans and water inputs.
  const ratio = ratioOf(values.beansG, values.waterMl) ?? '—';
  // Surface the base recipe's ratio as a "was" hint when it has shifted.
  const baseRatio =
    base != null
      ? ratioOf(
          base.beansG != null ? String(base.beansG) : '',
          base.waterMl != null ? String(base.waterMl) : '',
        )
      : null;
  const ratioHint = baseRatio && baseRatio !== ratio ? baseRatio : undefined;

  return (
    <View style={styles.fields}>
      <CascadeItem index={0}>
        <FormField label="Brewer" horizontal>
          <ComboBoxField
            label="Brewer"
            value={values.brewer}
            options={options.brewer}
            placeholder="Which brewer?"
            onChange={set('brewer')}
          />
          <FieldDiffHint previous={hintFor('brewer')} />
        </FormField>
      </CascadeItem>

      <CascadeItem index={1}>
        <FormField label="Filter" horizontal>
          <ComboBoxField
            label="Filter"
            value={values.filter}
            options={options.filter}
            placeholder="Which filter?"
            onChange={set('filter')}
          />
          <FieldDiffHint previous={hintFor('filter')} />
        </FormField>
      </CascadeItem>

      <CascadeItem index={2}>
        <FormField label="Grinder" horizontal>
          <ComboBoxField
            label="Grinder"
            value={values.grinder}
            options={options.grinder}
            placeholder="Which grinder?"
            onChange={set('grinder')}
          />
          <FieldDiffHint previous={hintFor('grinder')} />
        </FormField>
      </CascadeItem>

      <CascadeItem index={3}>
        <FormField label="Grind size" horizontal>
          <ComboBoxField
            label="Grind size"
            value={values.grind}
            options={options.grind}
            placeholder="How fine?"
            keyboardType="decimal-pad"
            onChange={set('grind')}
          />
          <FieldDiffHint previous={hintFor('grind')} />
        </FormField>
      </CascadeItem>

      <CascadeItem index={4}>
        <FormField label="Beans (g)" horizontal>
          <ComboBoxField
            label="Beans (g)"
            value={values.beansG}
            options={options.beansG}
            placeholder="How much coffee?"
            keyboardType="decimal-pad"
            onChange={set('beansG')}
          />
          <FieldDiffHint previous={hintFor('beansG')} />
        </FormField>
      </CascadeItem>

      <CascadeItem index={5}>
        <FormField label="Water (ml)" horizontal>
          <ComboBoxField
            label="Water (ml)"
            value={values.waterMl}
            options={options.waterMl}
            placeholder="How much water?"
            keyboardType="decimal-pad"
            onChange={set('waterMl')}
          />
          <FieldDiffHint previous={hintFor('waterMl')} />
        </FormField>
      </CascadeItem>

      <CascadeItem index={6}>
        <FormField label="Ratio" horizontal>
          <Text style={styles.ratioValue}>{ratio}</Text>
          <FieldDiffHint previous={ratioHint} />
        </FormField>
      </CascadeItem>

      <CascadeItem index={7}>
        <FormField label="Temperature" horizontal>
          <ComboBoxField
            label="Temperature"
            value={values.tempC}
            options={options.tempC}
            placeholder="How hot?"
            keyboardType="decimal-pad"
            formatOption={formatTemp}
            onChange={set('tempC')}
          />
          <FieldDiffHint previous={hintFor('tempC')} />
        </FormField>
      </CascadeItem>

      <CascadeItem index={8}>
        <FormField label="Pour structure" labelStyle={styles.pourLabel}>
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
      </CascadeItem>

      <CascadeItem index={9}>
        <FormField label="Date" horizontal>
          <DateField
            value={values.date}
            onChange={(date) => onChange({ date })}
            style={styles.datePicker}
          />
        </FormField>
      </CascadeItem>

      <CascadeItem index={10}>
        <FormField label="Rating" horizontal>
          <View style={styles.ratingWrap}>
            <RatingInput value={values.rating} onChange={(rating) => onChange({ rating })} />
          </View>
        </FormField>
      </CascadeItem>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
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
  ratioValue: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  // Match the other (horizontal) field labels while keeping the label above the input.
  pourLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
