import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee } from '@shared/lib/coffees';
import { useCoffees } from '../../hooks/useCoffees';
import { useSuspendDismissGesture } from '../../hooks/useSuspendDismissGesture';
import { PartialBeanUpdateError, updateBeanDetails } from '../../lib/api';
import { confirmDiscard } from '../../lib/confirmDiscard';
import { BeanFields, NewBeanDraft, draftFromCoffee } from './BeanFields';
import { ErrorBox } from '../ErrorBox';
import { PrimaryButton } from '../PrimaryButton';
import { LogFormScaffold } from './LogFormScaffold';
import { SheetOverlay } from '../surfaces/SheetOverlay';

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
  const { applyCups } = useCoffees();
  const [initial] = useState<NewBeanDraft>(() => draftFromCoffee(coffee));
  const [form, setForm] = useState<NewBeanDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );
  // While this sheet is up, a pull-down must not dismiss the page underneath it.
  useSuspendDismissGesture(true);
  const close = () => confirmDiscard(dirty && !saving, onClose);

  /** An emptied optional field is sent as null so the deletion actually saves. */
  const optional = (v: string) => v.trim() || null;

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
      const result = await updateBeanDetails(coffee.id, {
        bean: form.bean.trim(),
        roaster: form.roaster.trim(),
        origin: optional(form.origin),
        process: optional(form.process),
        roastLevel: optional(form.roastLevel),
        region: optional(form.region),
        variety: optional(form.variety),
        altitude: optional(form.altitude),
        notes: optional(form.notes),
      });
      applyCups(result.cups);
      await onSaved(result.id);
    } catch (e: unknown) {
      // Show whichever cups did save, so the shelf matches Notion; Save again
      // retries only the cups that still differ.
      if (e instanceof PartialBeanUpdateError) applyCups(e.updated);
      setError(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  };

  return (
    <SheetOverlay>
      <LogFormScaffold
        onBack={close}
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
    </SheetOverlay>
  );
}

const styles = StyleSheet.create({
  error: { marginBottom: 16 },
  saveBtn: { marginTop: 24 },
});
