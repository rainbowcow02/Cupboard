import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bagImgFor, coffeeId, Coffee } from '@shared/lib/coffees';
import { colors, fonts, surfaces } from '@shared/theme';
import { BeanFields, NewBeanDraft, blankBeanDraft } from './BeanFields';
import { ErrorBox } from '../ErrorBox';
import { PrimaryButton } from '../PrimaryButton';
import { LogFormScaffold } from './LogFormScaffold';

export type { NewBeanDraft } from './BeanFields';

interface Props {
  bottomInset: number;
  onBack: () => void;
  onContinue: (coffee: Coffee) => void;
  /** Shown on the manual-add path; opens the paste-a-link flow. Hidden in review mode. */
  onAddViaLink?: () => void;
  /** Pre-fills the form — used to review details extracted from a link. */
  initialDraft?: Partial<NewBeanDraft>;
  title?: string;
  description?: string;
  submitLabel?: string;
}

export function NewBeanStep({
  bottomInset,
  onBack,
  onContinue,
  onAddViaLink,
  initialDraft,
  title = 'Add new coffee',
  description = 'Share the origin story of your coffee bean.',
  submitLabel = 'Continue',
}: Props) {
  const [form, setForm] = useState<NewBeanDraft>({ ...blankBeanDraft, ...initialDraft });
  const [error, setError] = useState<string | null>(null);

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
      altitude: form.altitude.trim() || undefined,
      notes: form.notes.trim() || undefined,
      bagImg: bagImgFor(form.bean, form.roaster),
      brews: [],
    };
    onContinue(coffee);
  };

  return (
    <LogFormScaffold
      onBack={onBack}
      title={title}
      description={description}
      bottomInset={bottomInset}
    >
      {onAddViaLink ? (
        <Pressable
          onPress={onAddViaLink}
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
          accessibilityRole="button"
          accessibilityLabel="Add a coffee from a link"
        >
          <Text style={styles.linkGlyph}>🔗</Text>
          <View style={styles.linkText}>
            <Text style={styles.linkTitle}>Add bean via link</Text>
            <Text style={styles.linkSubtitle}>Bean details will be imported from the link.</Text>
          </View>
        </Pressable>
      ) : null}

      {error ? <ErrorBox message={error} style={styles.error} /> : null}

      <BeanFields form={form} set={set} />

      <PrimaryButton
        label={submitLabel}
        onPress={continueToRecipe}
        style={styles.continueBtn}
        accessibilityLabel="Continue to recipe setup"
      />
    </LogFormScaffold>
  );
}

const styles = StyleSheet.create({
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: surfaces.pillFill,
    marginBottom: 32,
  },
  linkRowPressed: { opacity: 0.85 },
  linkGlyph: { fontSize: 20 },
  linkText: { flex: 1, minWidth: 0 },
  linkTitle: {
    fontFamily: fonts.sans,
    fontWeight: '800',
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
