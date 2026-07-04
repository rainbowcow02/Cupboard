import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { updateBeanDetails } from '../../lib/api';
import { BeanFields, NewBeanDraft, draftFromCoffee } from './BeanFields';
import { ErrorBox } from '../ErrorBox';
import { PrimaryButton } from '../PrimaryButton';
import { LogFormScaffold } from './LogFormScaffold';

interface Props {
  coffee: Coffee;
  onClose: () => void;
  /** Called with the coffee's (possibly renamed) id once the edit is saved. */
  onSaved: (id: string) => Promise<void> | void;
}

/**
 * Full-screen sheet for editing a coffee's bean details. Mirrors the new-bean
 * form (same fields via BeanFields, same glass-back scaffold), but pre-fills from
 * the existing coffee and persists changes across every cup of that bean on save.
 */
export function EditBeanStep({ coffee, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<NewBeanDraft>(() => draftFromCoffee(coffee));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof NewBeanDraft) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (saving) return;
    if (!form.bean.trim()) {
      setError('Add a bean name to save.');
      return;
    }
    if (!form.roaster.trim()) {
      setError('Add a roaster to save.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const newId = await updateBeanDetails(coffee.id, {
        bean: form.bean.trim(),
        roaster: form.roaster.trim(),
        origin: form.origin.trim(),
        process: form.process.trim(),
        roastLevel: form.roastLevel.trim(),
        region: form.region.trim(),
        variety: form.variety.trim(),
        altitude: form.altitude.trim(),
        notes: form.notes.trim(),
      });
      await onSaved(newId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  };

  return (
    <View style={styles.sheet}>
      <LogFormScaffold
        onBack={onClose}
        title="Edit coffee"
        description="Update the details for this bean."
        bottomInset={insets.bottom}
      >
        {error ? <ErrorBox message={error} style={styles.error} /> : null}

        <BeanFields form={form} set={set} />

        <PrimaryButton
          label="Save changes"
          busy={saving}
          busyLabel="Saving…"
          onPress={save}
          style={styles.saveBtn}
          accessibilityLabel="Save coffee details"
        />
      </LogFormScaffold>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pearl,
    zIndex: 20,
  },
  error: { marginBottom: 16 },
  saveBtn: { marginTop: 24 },
});
