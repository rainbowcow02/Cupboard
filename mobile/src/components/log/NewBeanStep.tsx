import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { bagImgFor, coffeeId, Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { useCoffees } from '../../hooks/useCoffees';
import { ComboBoxField } from '../ComboBoxField';
import { FormField, fieldInputStyle } from '../FormField';
import { TAB_BAR_HEIGHT } from '../TabBar';

/** Distinct, non-empty values for a coffee field, sorted A–Z. */
function distinctValues(coffees: Coffee[], field: keyof Coffee): string[] {
  const seen = new Set<string>();
  for (const coffee of coffees) {
    const raw = coffee[field];
    if (typeof raw === 'string' && raw.trim()) seen.add(raw.trim());
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

export interface NewBeanDraft {
  bean: string;
  roaster: string;
  origin: string;
  process: string;
  roastLevel: string;
  region: string;
  variety: string;
  notes: string;
}

const blank: NewBeanDraft = {
  bean: '',
  roaster: '',
  origin: '',
  process: '',
  roastLevel: '',
  region: '',
  variety: '',
  notes: '',
};

interface Props {
  bottomInset: number;
  onContinue: (coffee: Coffee) => void;
}

export function NewBeanStep({ bottomInset, onContinue }: Props) {
  const { coffees } = useCoffees();
  const [form, setForm] = useState({ ...blank });
  const [error, setError] = useState<string | null>(null);

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

  const set = (k: keyof NewBeanDraft) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const continueToRecipe = () => {
    if (!form.bean.trim()) {
      setError('Add a bean name to continue.');
      return;
    }
    if (!form.roaster.trim()) {
      setError('Add a roaster to continue.');
      return;
    }
    setError(null);
    const coffee: Coffee = {
      id: coffeeId(form.bean, form.roaster),
      bean: form.bean.trim(),
      roaster: form.roaster.trim(),
      origin: form.origin.trim() || undefined,
      process: form.process.trim() || undefined,
      roastLevel: form.roastLevel.trim() || undefined,
      region: form.region.trim() || undefined,
      variety: form.variety.trim() || undefined,
      notes: form.notes.trim() || undefined,
      bagImg: bagImgFor(form.bean, form.roaster),
      brews: [],
    };
    onContinue(coffee);
  };

  const scrollBottomPad = Math.max(bottomInset, 16) + TAB_BAR_HEIGHT + 48;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.prompt}>Tell Cupboard about the bag you’re opening.</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.fields}>
        <FormField label="Bean">
          <TextInput
            style={fieldInputStyle}
            value={form.bean}
            onChangeText={set('bean')}
            placeholder="Gitega 861"
            placeholderTextColor={colors.greyDark}
            returnKeyType="next"
          />
        </FormField>
        <FormField label="Roaster">
          <ComboBoxField
            label="Roaster"
            value={form.roaster}
            options={options.roaster}
            placeholder="H&S Coffee Roasters"
            onChange={set('roaster')}
          />
        </FormField>
        <FormField label="Country">
          <ComboBoxField
            label="Country"
            value={form.origin}
            options={options.origin}
            placeholder="Rwanda"
            onChange={set('origin')}
            flagFor={(option) => ORIGIN_FLAGS[option] || ''}
          />
        </FormField>
        <View style={styles.row}>
          <FormField label="Process">
            <ComboBoxField
              label="Process"
              value={form.process}
              options={options.process}
              placeholder="Washed"
              onChange={set('process')}
            />
          </FormField>
          <FormField label="Roast">
            <ComboBoxField
              label="Roast"
              value={form.roastLevel}
              options={options.roastLevel}
              placeholder="Light"
              onChange={set('roastLevel')}
            />
          </FormField>
        </View>
        <FormField label="Region">
          <ComboBoxField
            label="Region"
            value={form.region}
            options={options.region}
            placeholder="Nyamagabe"
            onChange={set('region')}
          />
        </FormField>
        <FormField label="Variety">
          <ComboBoxField
            label="Variety"
            value={form.variety}
            options={options.variety}
            placeholder="Red Bourbon"
            onChange={set('variety')}
          />
        </FormField>
        <FormField label="Tasting notes">
          <TextInput
            style={fieldInputStyle}
            value={form.notes}
            onChangeText={set('notes')}
            placeholder="Red Apple, Peach, Hibiscus"
            placeholderTextColor={colors.greyDark}
            returnKeyType="done"
          />
        </FormField>
      </View>

      <Pressable
        onPress={continueToRecipe}
        style={styles.continueBtn}
        accessibilityRole="button"
        accessibilityLabel="Continue to recipe setup"
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 4 },
  prompt: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
    color: colors.greyDark,
    lineHeight: 21,
    marginBottom: 16,
  },
  fields: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  errorBox: {
    backgroundColor: 'rgba(252,153,155,0.22)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.burgundy,
  },
  continueBtn: {
    marginTop: 24,
    backgroundColor: colors.burgundy,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.pearl,
  },
});
