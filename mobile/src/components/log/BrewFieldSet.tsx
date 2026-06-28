import { StyleSheet, TextInput, View } from 'react-native';
import { Brew } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { DateField } from '../DateField';
import { FieldDiffHint } from '../FieldDiffHint';
import { FormField, fieldInputStyle } from '../FormField';
import { RatingInput } from '../RatingInput';

/** In-memory form state for a brew recipe (numbers held as strings). */
export interface BrewFormValues {
  brewer: string;
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
type TextKey = 'brewer' | 'filter' | 'grind' | 'beansG' | 'waterMl' | 'tempC' | 'recipeToTest';

export function BrewFieldSet({ values, onChange, base }: Props) {
  const set = (k: TextKey) => (v: string) => onChange({ [k]: v } as Partial<BrewFormValues>);

  // Raw compare value + display string (with unit) for each concise field.
  const baseDisplay = base
    ? {
        brewer: { raw: base.brewer ?? '', show: base.brewer ?? '' },
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
          show: base.tempC != null ? `${base.tempC}°C` : '',
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
      <FormField label="Brewer">
        <TextInput
          style={fieldInputStyle}
          value={values.brewer}
          onChangeText={set('brewer')}
          placeholder="Hario V60"
          placeholderTextColor={colors.greyDark}
          returnKeyType="next"
        />
        <FieldDiffHint previous={hintFor('brewer')} />
      </FormField>

      <FormField label="Filter">
        <TextInput
          style={fieldInputStyle}
          value={values.filter}
          onChangeText={set('filter')}
          placeholder="Cafec Light"
          placeholderTextColor={colors.greyDark}
          returnKeyType="next"
        />
        <FieldDiffHint previous={hintFor('filter')} />
      </FormField>

      <FormField label="Grind size">
        <TextInput
          style={fieldInputStyle}
          value={values.grind}
          onChangeText={set('grind')}
          placeholder="14"
          placeholderTextColor={colors.greyDark}
          returnKeyType="next"
        />
        <FieldDiffHint previous={hintFor('grind')} />
      </FormField>

      <View style={styles.row}>
        <FormField label="Beans (g)">
          <TextInput
            style={fieldInputStyle}
            value={values.beansG}
            onChangeText={set('beansG')}
            placeholder="18"
            placeholderTextColor={colors.greyDark}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
          <FieldDiffHint previous={hintFor('beansG')} />
        </FormField>
        <FormField label="Water (ml)">
          <TextInput
            style={fieldInputStyle}
            value={values.waterMl}
            onChangeText={set('waterMl')}
            placeholder="300"
            placeholderTextColor={colors.greyDark}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
          <FieldDiffHint previous={hintFor('waterMl')} />
        </FormField>
        <FormField label="Temp °C">
          <TextInput
            style={fieldInputStyle}
            value={values.tempC}
            onChangeText={set('tempC')}
            placeholder="94"
            placeholderTextColor={colors.greyDark}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
          <FieldDiffHint previous={hintFor('tempC')} />
        </FormField>
      </View>

      <FormField label="Pour structure">
        <TextInput
          style={[fieldInputStyle, styles.recipeInput]}
          value={values.recipeToTest}
          onChangeText={set('recipeToTest')}
          placeholder={'Bloom → 40ml swirl, P1 → 120ml center pour, brew time 2:45'}
          placeholderTextColor={colors.greyDark}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
        />
      </FormField>

      <FormField label="Date">
        <DateField
          value={values.date}
          onChange={(date) => onChange({ date })}
          style={styles.datePicker}
        />
      </FormField>

      <FormField label="Rating">
        <RatingInput value={values.rating} onChange={(rating) => onChange({ rating })} />
      </FormField>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  recipeInput: { minHeight: 96, paddingTop: 12 },
  datePicker: { alignSelf: 'flex-start', marginTop: 2 },
});
