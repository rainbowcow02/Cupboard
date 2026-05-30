import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Brew, formatDate, parseRecipe } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';

interface Props {
  brew: Brew;
  onPress?: () => void;
}

function CupRating({ rating }: { rating?: number }) {
  const r = rating ?? 0;
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Svg key={n} width={14} height={14} viewBox="0 0 9 9">
          <Polygon
            points="4.5,0.5 5.6,3.2 8.5,3.4 6.4,5.3 7.1,8.1 4.5,6.6 1.9,8.1 2.6,5.3 0.5,3.4 3.4,3.2"
            fill={n <= r ? colors.moss : 'none'}
            stroke={n <= r ? colors.moss : colors.greyLight}
            strokeWidth={0.75}
          />
        </Svg>
      ))}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

export function BrewCard({ brew, onPress }: Props) {
  const hasRatio = brew.beansG && brew.waterMl;
  const ratio = hasRatio ? `1:${(brew.waterMl! / brew.beansG!).toFixed(1)}` : '—';
  const parsed = parseRecipe(brew.recipeToTest);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(brew.date)}</Text>
        <CupRating rating={brew.rating} />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {[
          { label: 'Beans', value: brew.beansG ? `${brew.beansG}g` : '—' },
          { label: 'Water', value: brew.waterMl ? `${brew.waterMl}ml` : '—' },
          { label: 'Ratio', value: ratio },
          { label: 'Grind', value: brew.grind || '—' },
          { label: 'Temp', value: brew.tempC ? `${brew.tempC}°C` : '—' },
        ].map(({ label, value }) => (
          <View key={label} style={styles.statCol}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        ))}
      </View>

      <Divider />
      <Row label="Dripper" value={brew.brewer} />
      <Divider />
      <Row label="Filter paper" value={brew.filter} />

      {parsed && (
        <>
          {parsed.pours.length > 0 && (
            <>
              <Divider />
              <View style={styles.section}>
                {parsed.pours.map(({ step, amount, technique }) => (
                  <View key={step} style={styles.pourRow}>
                    <Text style={[styles.detailLabel, { width: 50 }]}>{step}</Text>
                    <Text style={[styles.statValue, { width: 60 }]}>{amount}</Text>
                    <Text style={[styles.detailLabel, { flex: 1 }]}>{technique}</Text>
                  </View>
                ))}
                {parsed.agitation && (
                  <Text style={[styles.detailLabel, styles.agitation]}>{parsed.agitation}</Text>
                )}
              </View>
            </>
          )}
          {parsed.brewTime && (
            <>
              <Divider />
              <View style={[styles.detailRow, styles.section]}>
                <Text style={styles.detailLabel}>Brew time</Text>
                <Text style={styles.statValue}>{parsed.brewTime}</Text>
              </View>
            </>
          )}
        </>
      )}

      {!parsed && brew.recipeToTest && (
        <>
          <Divider />
          <View style={styles.section}>
            <Text style={[styles.detailLabel, { marginBottom: 8 }]}>Recipe</Text>
            <Text style={styles.detailValue}>{brew.recipeToTest}</Text>
          </View>
        </>
      )}

      {brew.tastingNotes && (
        <>
          <Divider />
          <View style={styles.section}>
            <Text style={[styles.detailLabel, { marginBottom: 8 }]}>Tasting notes</Text>
            <Text style={styles.detailValue}>{brew.tastingNotes}</Text>
          </View>
        </>
      )}

      {brew.brewNotes && (
        <>
          <Divider />
          <View style={styles.section}>
            <Text style={[styles.detailLabel, { marginBottom: 8 }]}>Brew notes</Text>
            <Text style={styles.detailValue}>{brew.brewNotes}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 34, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  date: { fontFamily: fonts.condensed, fontWeight: '600', fontSize: 17, color: '#000', letterSpacing: -0.5, lineHeight: 24 },
  ratingRow: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingHorizontal: 24 },
  statCol: { alignItems: 'center', gap: 4 },
  statLabel: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.greyDark },
  statValue: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 17, color: '#000', letterSpacing: -0.5, lineHeight: 24 },
  divider: { height: 0.5, backgroundColor: '#E7E7E7', marginHorizontal: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  detailLabel: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.greyDark, flexShrink: 0, lineHeight: 20 },
  detailValue: { fontFamily: fonts.sans, fontWeight: '400', fontSize: 15, color: colors.greyDark, textAlign: 'right', lineHeight: 22, flex: 1 },
  section: { padding: 16, paddingHorizontal: 24 },
  pourRow: { flexDirection: 'row', alignItems: 'center', gap: 8, lineHeight: 22 },
  agitation: { marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#E7E7E7' },
});
