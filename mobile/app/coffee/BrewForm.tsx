import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { DateField } from '../../src/components/DateField';
import { FormField, fieldInputStyle } from '../../src/components/FormField';
import { RatingInput } from '../../src/components/RatingInput';
import { createCup, updateCup, deleteCup } from '../../src/lib/api';

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

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
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

  const [form, setForm] = useState({
    brewer: source?.brewer ?? '',
    filter: source?.filter ?? '',
    grind: source?.grind ?? '',
    beansG: source?.beansG != null ? String(source.beansG) : '',
    waterMl: source?.waterMl != null ? String(source.waterMl) : '',
    tempC: source?.tempC != null ? String(source.tempC) : '',
    recipeToTest: source?.recipeToTest ?? '',
    date: toDateInput(editing ? brew?.date : undefined),
    rating: editing ? (brew?.rating ?? 0) : 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const brewFields = {
        brewer: form.brewer || undefined,
        filter: form.filter || undefined,
        grind: form.grind || undefined,
        beansG: form.beansG ? Number(form.beansG) : undefined,
        waterMl: form.waterMl ? Number(form.waterMl) : undefined,
        tempC: form.tempC ? Number(form.tempC) : undefined,
        recipeToTest: form.recipeToTest.trim() || undefined,
        date: toISODate(form.date),
        rating: form.rating || undefined,
      };

      if (editing && brew?.id) {
        await updateCup(String(brew.id), brewFields);
      } else {
        await createCup({
          bean: coffee.bean,
          roaster: coffee.roaster,
          origin: coffee.origin,
          process: coffee.process,
          roastLevel: coffee.roastLevel,
          region: coffee.region,
          variety: coffee.variety,
          notes: coffee.notes,
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

  return (
    <View style={[embedded ? styles.embedded : styles.sheet, !embedded && { paddingTop: insets.top }]}>
      {!embedded ? (
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>{screenTitle}</Text>
          <Pressable onPress={save} disabled={saving} hitSlop={8} accessibilityRole="button" accessibilityLabel="Save brew">
            <Text style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (embedded ? 24 : insets.bottom + 48) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {embedded ? null : (
          <Text style={styles.subtitle}>
            Brew recipe for <Text style={styles.subtitleBold}>{coffee.bean}</Text> · {coffee.roaster}
          </Text>
        )}

        {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

        <View style={styles.fields}>
          <FormField label="Brewer">
            <TextInput style={fieldInputStyle} value={form.brewer} onChangeText={set('brewer')} placeholder="Hario V60" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>
          <FormField label="Filter">
            <TextInput style={fieldInputStyle} value={form.filter} onChangeText={set('filter')} placeholder="Cafec Light" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>
          <FormField label="Grind size">
            <TextInput style={fieldInputStyle} value={form.grind} onChangeText={set('grind')} placeholder="14" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>

          <View style={styles.row}>
            <FormField label="Beans (g)">
              <TextInput style={fieldInputStyle} value={form.beansG} onChangeText={set('beansG')} placeholder="18" placeholderTextColor={colors.greyDark} keyboardType="decimal-pad" returnKeyType="next" />
            </FormField>
            <FormField label="Water (ml)">
              <TextInput style={fieldInputStyle} value={form.waterMl} onChangeText={set('waterMl')} placeholder="300" placeholderTextColor={colors.greyDark} keyboardType="decimal-pad" returnKeyType="next" />
            </FormField>
            <FormField label="Temp °C">
              <TextInput style={fieldInputStyle} value={form.tempC} onChangeText={set('tempC')} placeholder="94" placeholderTextColor={colors.greyDark} keyboardType="decimal-pad" returnKeyType="next" />
            </FormField>
          </View>

          <FormField label="Pour structure">
            <TextInput
              style={[fieldInputStyle, styles.recipeInput]}
              value={form.recipeToTest}
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
              value={form.date}
              onChange={(date) => setForm((f) => ({ ...f, date }))}
              style={styles.datePicker}
            />
          </FormField>

          <FormField label="Rating">
            <RatingInput value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </FormField>
        </View>

        {editing && (
          <Pressable onPress={remove} disabled={saving} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>
              {confirmDelete ? 'Tap again to delete this brew' : 'Delete brew'}
            </Text>
          </Pressable>
        )}

        {embedded ? (
          <Pressable
            onPress={save}
            disabled={saving}
            style={[styles.embeddedSaveBtn, saving && styles.embeddedSaveBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Save cup"
          >
            <Text style={styles.embeddedSaveBtnText}>{saving ? 'Saving…' : 'Save cup'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pearl,
    zIndex: 10,
  },
  embedded: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cancel: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 15, color: colors.greyDark },
  title: { fontFamily: fonts.serif, fontSize: 19, color: '#000' },
  saveBtn: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 15, color: colors.burgundy },
  saveBtnDisabled: { color: '#b9a99a' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 8 },
  subtitle: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.greyDark, marginBottom: 20 },
  subtitleBold: { color: '#000', fontWeight: '700' },
  errorBox: { backgroundColor: 'rgba(252,153,155,0.22)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.burgundy },
  fields: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  recipeInput: { minHeight: 96, paddingTop: 12 },
  datePicker: { alignSelf: 'flex-start', marginTop: 2 },
  deleteBtn: {
    marginTop: 28,
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(93,5,5,0.25)',
    alignItems: 'center',
  },
  deleteBtnText: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 14, color: colors.burgundy },
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
