import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors, fonts } from '@shared/theme';
import { FormField, fieldInputStyle } from '../../src/components/FormField';
import { RatingInput } from '../../src/components/RatingInput';
import { createCup } from '../../src/lib/api';
import { useCoffees } from '../../src/hooks/useCoffees';

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const blank = {
  bean: '', roaster: '', origin: '', process: '', roastLevel: '',
  region: '', variety: '', notes: '',
  brewer: '', filter: '', grind: '',
  beansG: '', waterMl: '', tempC: '',
  rating: 0,
  date: new Date(),
};

function FormSectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function LogScreen() {
  const { refresh } = useCoffees();
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (saving) return;
    if (!form.bean.trim()) { setError('Add a coffee name (Bean) first.'); return; }
    setSaving(true);
    setError(null);
    try {
      await createCup({
        bean: form.bean,
        roaster: form.roaster || undefined,
        origin: form.origin || undefined,
        process: form.process || undefined,
        roastLevel: form.roastLevel || undefined,
        region: form.region || undefined,
        variety: form.variety || undefined,
        notes: form.notes || undefined,
        brewer: form.brewer || undefined,
        filter: form.filter || undefined,
        grind: form.grind || undefined,
        beansG: form.beansG ? Number(form.beansG) : undefined,
        waterMl: form.waterMl ? Number(form.waterMl) : undefined,
        tempC: form.tempC ? Number(form.tempC) : undefined,
        date: toISODate(form.date),
        rating: form.rating || undefined,
      });
      await refresh();
      setForm({ ...blank, date: new Date() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Log a Cup</Text>
        <Pressable onPress={save} disabled={saving} style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
      >
        {saved && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Saved! Cup added to your cupboard.</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FormSectionLabel>Coffee</FormSectionLabel>
        <View style={styles.fields}>
          <FormField label="Bean">
            <TextInput style={fieldInputStyle} value={form.bean} onChangeText={set('bean')} placeholder="Gitega 861" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>
          <FormField label="Roaster">
            <TextInput style={fieldInputStyle} value={form.roaster} onChangeText={set('roaster')} placeholder="H&S Coffee Roasters" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>
          <FormField label="Country">
            <TextInput style={fieldInputStyle} value={form.origin} onChangeText={set('origin')} placeholder="Rwanda" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>
          <View style={styles.row}>
            <FormField label="Process">
              <TextInput style={fieldInputStyle} value={form.process} onChangeText={set('process')} placeholder="Washed" placeholderTextColor={colors.greyDark} returnKeyType="next" />
            </FormField>
            <FormField label="Roast">
              <TextInput style={fieldInputStyle} value={form.roastLevel} onChangeText={set('roastLevel')} placeholder="Light" placeholderTextColor={colors.greyDark} returnKeyType="next" />
            </FormField>
          </View>
          <FormField label="Region">
            <TextInput style={fieldInputStyle} value={form.region} onChangeText={set('region')} placeholder="Nyamagabe" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>
          <FormField label="Variety">
            <TextInput style={fieldInputStyle} value={form.variety} onChangeText={set('variety')} placeholder="Red Bourbon" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>
          <FormField label="Tasting notes">
            <TextInput style={fieldInputStyle} value={form.notes} onChangeText={set('notes')} placeholder="Red Apple, Peach, Hibiscus" placeholderTextColor={colors.greyDark} returnKeyType="next" />
          </FormField>
        </View>

        <FormSectionLabel>Brew</FormSectionLabel>
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
              <TextInput style={fieldInputStyle} value={form.tempC} onChangeText={set('tempC')} placeholder="94" placeholderTextColor={colors.greyDark} keyboardType="decimal-pad" returnKeyType="done" />
            </FormField>
          </View>
          <FormField label="Date">
            <DateTimePicker
              value={form.date}
              mode="date"
              display="compact"
              onChange={(_, d) => d && setForm((f) => ({ ...f, date: d }))}
              style={styles.datePicker}
              themeVariant="light"
            />
          </FormField>
          <FormField label="Rating">
            <RatingInput value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </FormField>
        </View>

        <View style={{ height: 32 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pearl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: { fontFamily: fonts.serif, fontSize: 32, color: '#000', lineHeight: 38, letterSpacing: -0.5 },
  saveBtn: {
    backgroundColor: colors.burgundy,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  saveBtnDisabled: { backgroundColor: '#b9a99a' },
  saveBtnText: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 14, color: colors.pearl },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 12, gap: 0 },
  sectionLabel: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: '#000',
    marginTop: 16,
    marginBottom: 12,
    lineHeight: 26,
  },
  fields: { gap: 14, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  datePicker: { alignSelf: 'flex-start', marginTop: 2 },
  errorBox: { backgroundColor: 'rgba(252,153,155,0.22)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.burgundy },
  successBox: { backgroundColor: 'rgba(53,92,68,0.12)', borderRadius: 12, padding: 12, marginBottom: 16 },
  successText: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.moss },
});
