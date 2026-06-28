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
import { ErrorBox } from '../ErrorBox';
import { FormField, fieldInputStyle } from '../FormField';
import { PrimaryButton } from '../PrimaryButton';
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
  /** Shown on the manual-add path; opens the paste-a-link flow. Hidden in review mode. */
  onAddViaLink?: () => void;
  /** Pre-fills the form — used to review details extracted from a link. */
  initialDraft?: Partial<NewBeanDraft>;
  prompt?: string;
  submitLabel?: string;
}

export function NewBeanStep({
  bottomInset,
  onContinue,
  onAddViaLink,
  initialDraft,
  prompt = 'Tell Cupboard about the bag you’re opening.',
  submitLabel = 'Continue',
}: Props) {
  const { coffees } = useCoffees();
  const [form, setForm] = useState<NewBeanDraft>({ ...blank, ...initialDraft });
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
      <Text style={styles.prompt}>{prompt}</Text>

      {onAddViaLink ? (
        <Pressable
          onPress={onAddViaLink}
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
          accessibilityRole="button"
          accessibilityLabel="Add a coffee from a link"
        >
          <Text style={styles.linkGlyph}>🔗</Text>
          <View style={styles.linkText}>
            <Text style={styles.linkTitle}>Add from a link</Text>
            <Text style={styles.linkSubtitle}>Paste a roaster URL to fill these in automatically</Text>
          </View>
        </Pressable>
      ) : null}

      {error ? <ErrorBox message={error} style={styles.error} /> : null}

      <View style={styles.fields}>
        <FormField label="Bean">
          <TextInput
            style={fieldInputStyle}
            value={form.bean}
            onChangeText={set('bean')}
            placeholder="Add bean name"
            placeholderTextColor={colors.greyDark}
            returnKeyType="next"
          />
        </FormField>
        <FormField label="Roaster">
          <ComboBoxField
            label="Roaster"
            value={form.roaster}
            options={options.roaster}
            placeholder="Pick a roaster"
            onChange={set('roaster')}
          />
        </FormField>
        <FormField label="Country">
          <ComboBoxField
            label="Country"
            value={form.origin}
            options={options.origin}
            placeholder="Where's it from?"
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
              placeholder="Pick a process"
              onChange={set('process')}
            />
          </FormField>
          <FormField label="Roast">
            <ComboBoxField
              label="Roast"
              value={form.roastLevel}
              options={options.roastLevel}
              placeholder="Pick a roast"
              onChange={set('roastLevel')}
            />
          </FormField>
        </View>
        <FormField label="Region">
          <ComboBoxField
            label="Region"
            value={form.region}
            options={options.region}
            placeholder="Add a region"
            onChange={set('region')}
          />
        </FormField>
        <FormField label="Variety">
          <ComboBoxField
            label="Variety"
            value={form.variety}
            options={options.variety}
            placeholder="Add a variety"
            onChange={set('variety')}
          />
        </FormField>
        <FormField label="Tasting notes">
          <TextInput
            style={fieldInputStyle}
            value={form.notes}
            onChangeText={set('notes')}
            placeholder="Add tasting notes"
            placeholderTextColor={colors.greyDark}
            returnKeyType="done"
          />
        </FormField>
      </View>

      <PrimaryButton
        label={submitLabel}
        onPress={continueToRecipe}
        style={styles.continueBtn}
        accessibilityLabel="Continue to recipe setup"
      />
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  linkRowPressed: { opacity: 0.85 },
  linkGlyph: { fontSize: 20 },
  linkText: { flex: 1, minWidth: 0 },
  linkTitle: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 15,
    color: colors.black,
  },
  linkSubtitle: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    marginTop: 2,
  },
  error: { marginBottom: 16 },
  continueBtn: { marginTop: 24 },
});
