import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import {
  beanFieldsPayload,
  BrewFieldSet,
  BrewFormValues,
  brewFieldsPayload,
  recipeValuesFrom,
} from '../../src/components/log/BrewFieldSet';
import { HeaderPillButton } from '../../src/components/HeaderPillButton';
import { LogFormScaffold } from '../../src/components/log/LogFormScaffold';
import { SheetOverlay } from '../../src/components/surfaces/SheetOverlay';
import { createCup, updateCup, deleteCup } from '../../src/lib/api';
import { KeyboardAwareUpdateContext } from '../../src/lib/keyboardAwareUpdate';

/** The HOC attaches `update()` at runtime but the library's .d.ts omits it. */
type KeyboardAwareScrollHandle = InstanceType<typeof KeyboardAwareScrollView> & {
  update: () => void;
};

interface Props {
  coffee: Coffee;
  brew?: Brew | null;
  templateBrew?: Brew | null;
  embedded?: boolean;
  title?: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function toDateInput(value?: string | null): Date {
  if (!value) return new Date();
  const m = /^\d{4}-\d{2}-\d{2}/.exec(String(value).trim());
  return m ? new Date(`${m[0]}T12:00:00`) : new Date();
}

export function BrewForm({
  coffee,
  brew,
  templateBrew,
  embedded = false,
  title,
  onClose,
  onSaved,
}: Props) {
  const editing = !!brew;
  const source = brew ?? templateBrew;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<KeyboardAwareScrollHandle>(null);

  const [form, setForm] = useState<BrewFormValues>(() => ({
    ...recipeValuesFrom(source),
    date: toDateInput(editing ? brew?.date : undefined),
    rating: editing ? (brew?.rating ?? 0) : 0,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const brewFields = brewFieldsPayload(form);

      if (editing && brew?.id) {
        await updateCup(String(brew.id), brewFields);
      } else {
        await createCup({
          ...beanFieldsPayload(coffee),
          ...brewFields,
        });
      }
      await onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  };

  const remove = async () => {
    if (saving || !brew?.id) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    setError(null);
    try {
      await deleteCup(String(brew.id));
      await onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
      setSaving(false);
    }
  };

  const screenTitle = title ?? (editing ? 'Edit Brew' : templateBrew ? 'Tweak recipe' : 'New recipe');

  const fields = (
    <>
      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

      <BrewFieldSet
        values={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      />

      {editing && (
        <Pressable onPress={remove} disabled={saving} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>
            {confirmDelete ? 'Tap again to delete this brew' : 'Delete brew'}
          </Text>
        </Pressable>
      )}
    </>
  );

  if (!embedded) {
    // Same floating chrome as the Log flow's form steps — a glass icon button and
    // a header pill — with the title sitting in the scroll content beneath it.
    // The sheet is dismissed rather than navigated back from, so it takes an X.
    // No safe-area top padding: this sheet fills a screen presented as a native
    // modal, which already starts below the status bar, so the scaffold's own
    // 16px header inset lands the X level with the coffee-detail back button.
    return (
      <SheetOverlay>
        <LogFormScaffold
          onBack={onClose}
          leadingIcon="close"
          leadingLabel="Close without saving"
          title={screenTitle}
          description={
            <>
              Brew recipe for <Text style={styles.subtitleBold}>{coffee.bean}</Text> · {coffee.roaster}
            </>
          }
          rightAction={
            <HeaderPillButton
              label={saving ? 'Saving…' : 'Save'}
              onPress={save}
              disabled={saving}
              accessibilityLabel="Save brew"
            />
          }
          bottomInset={insets.bottom}
        >
          {fields}
        </LogFormScaffold>
      </SheetOverlay>
    );
  }

  return (
    <View style={styles.embedded}>
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={32}
        enableResetScrollToCoords={false}
      >
        {/* Lets a growing multiline field (e.g. Tasting/Brew notes) re-trigger the
            scroll-into-view as it gains lines, not just on initial focus. */}
        <KeyboardAwareUpdateContext.Provider value={() => scrollRef.current?.update()}>
          {fields}
        </KeyboardAwareUpdateContext.Provider>

        <Pressable
          onPress={save}
          disabled={saving}
          style={[styles.embeddedSaveBtn, saving && styles.embeddedSaveBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Save cup"
        >
          <Text style={styles.embeddedSaveBtnText}>{saving ? 'Saving…' : 'Save cup'}</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  embedded: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 8, paddingBottom: 24 },
  subtitleBold: { color: colors.black, fontWeight: '700' },
  errorBox: { backgroundColor: 'rgba(252,153,155,0.22)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.burgundy },
  deleteBtn: {
    marginTop: 28,
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(93,5,5,0.25)',
    alignItems: 'center',
  },
  deleteBtnText: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 14, color: colors.burgundy },
  embeddedSaveBtn: {
    marginTop: 28,
    backgroundColor: colors.burgundy,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  embeddedSaveBtnDisabled: { backgroundColor: '#b9a99a' },
  embeddedSaveBtnText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.pearl,
  },
});
