import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Brew, Coffee, parseRecipe } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { brewRatioLabel, brewSummaryLine } from '../../lib/brewSummary';
import { createCup } from '../../lib/api';
import { Card } from '../Card';
import { DateField } from '../DateField';
import { FormField } from '../FormField';
import { RatingInput } from '../RatingInput';
import { TAB_BAR_HEIGHT } from '../TabBar';

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface Props {
  coffee: Coffee;
  template: Brew;
  bottomInset: number;
  onSaved: () => Promise<void>;
}

export function QuickLogStep({ coffee, template, bottomInset, onSaved }: Props) {
  const [date, setDate] = useState(new Date());
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseRecipe(template.recipeToTest);
  const scrollBottomPad = Math.max(bottomInset, 16) + TAB_BAR_HEIGHT + 48;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await createCup({
        bean: coffee.bean,
        roaster: coffee.roaster,
        origin: coffee.origin,
        process: coffee.process,
        roastLevel: coffee.roastLevel,
        region: coffee.region,
        variety: coffee.variety,
        notes: coffee.notes,
        brewer: template.brewer,
        filter: template.filter,
        grind: template.grind,
        beansG: template.beansG,
        waterMl: template.waterMl,
        tempC: template.tempC,
        recipeToTest: template.recipeToTest,
        date: toISODate(date),
        rating: rating || undefined,
      });
      await onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Text style={styles.prompt}>You’re logging today’s cup with this recipe unchanged.</Text>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{brewSummaryLine(template)}</Text>
        <View style={styles.summaryRows}>
          {template.brewer ? <SummaryRow label="Brewer" value={template.brewer} /> : null}
          {template.filter ? <SummaryRow label="Filter" value={template.filter} /> : null}
          {template.grind ? <SummaryRow label="Grind" value={template.grind} /> : null}
          {brewRatioLabel(template) ? <SummaryRow label="Ratio" value={brewRatioLabel(template)!} /> : null}
          {template.tempC != null ? <SummaryRow label="Temp" value={`${template.tempC}°C`} /> : null}
        </View>

        {parsed && parsed.pours.length > 0 ? (
          <View style={styles.pourSection}>
            <Text style={styles.pourHeading}>Pour structure</Text>
            {parsed.pours.map(({ step, amount, technique }) => (
              <Text key={step} style={styles.pourLine}>
                {step} → {amount}{technique ? ` · ${technique}` : ''}
              </Text>
            ))}
          </View>
        ) : template.recipeToTest?.trim() ? (
          <View style={styles.pourSection}>
            <Text style={styles.pourHeading}>Pour structure</Text>
            <Text style={styles.pourNotes}>{template.recipeToTest}</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.fields}>
        <FormField label="Date">
          <DateField value={date} onChange={setDate} style={styles.datePicker} />
        </FormField>
        <FormField label="Rating">
          <RatingInput value={rating} onChange={setRating} />
        </FormField>
      </View>

      <Pressable
        onPress={save}
        disabled={saving}
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Save cup"
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save cup'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
  summaryCard: { padding: 18, marginBottom: 20 },
  summaryTitle: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 20,
    color: colors.black,
    lineHeight: 24,
    marginBottom: 12,
  },
  summaryRows: { gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryLabel: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 12,
    color: colors.greyDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 14,
    color: colors.black,
    flexShrink: 1,
    textAlign: 'right',
  },
  pourSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 6,
  },
  pourHeading: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: colors.greyDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pourLine: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
  },
  pourNotes: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
  },
  fields: { gap: 14, marginBottom: 20 },
  datePicker: { alignSelf: 'flex-start', marginTop: 2 },
  saveBtn: {
    backgroundColor: colors.burgundy,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#b9a99a' },
  saveBtnText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.pearl,
  },
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
});
