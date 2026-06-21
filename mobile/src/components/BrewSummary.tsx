import { StyleSheet, Text, View } from 'react-native';
import { Polyline, Svg } from 'react-native-svg';
import { Brew } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';

interface Props {
  brews: Brew[];
}

const SPARK_H = 24;
const SPARK_W = 200;
const SPARK_PAD = 2;
const BUCKETS = 4;

function SparkCell({ brews }: { brews: Brew[] }) {
  const rated = brews
    .filter((b) => b.rating != null && b.date != null)
    .sort((a, b) => {
      const ta = a.date ? Date.parse(a.date) : 0;
      const tb = b.date ? Date.parse(b.date) : 0;
      return ta - tb;
    });

  if (rated.length < 2) return null;

  const bucketSize = rated.length / BUCKETS;
  const values = Array.from({ length: BUCKETS }, (_, i) => {
    const start = Math.floor(i * bucketSize);
    const end = Math.min(rated.length, Math.floor((i + 1) * bucketSize));
    const slice = rated.slice(start, end);
    return slice.reduce((sum, b) => sum + b.rating!, 0) / slice.length;
  });

  const step = SPARK_W / (values.length - 1);
  const polylinePoints = values
    .map((v, i) => {
      const x = i * step;
      const y = SPARK_PAD + (SPARK_H - SPARK_PAD * 2) - ((Math.min(5, Math.max(1, v)) - 1) / 4) * (SPARK_H - SPARK_PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View style={styles.sparkCell} accessibilityLabel="Ratings">
      <Svg width="100%" height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none">
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.burgundy}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={styles.statLabel}>Ratings</Text>
    </View>
  );
}

export function BrewSummary({ brews }: Props) {
  if (brews.length === 0) return null;

  const ratedBrews = brews.filter((b) => b.rating != null);
  const medianRating = (() => {
    if (ratedBrews.length === 0) return null;
    const sorted = [...ratedBrews].sort((a, b) => a.rating! - b.rating!);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1].rating! + sorted[mid].rating!) / 2
      : sorted[mid].rating!;
  })();

  const totalGrams = brews.reduce((sum, b) => sum + (b.beansG ?? 0), 0);
  const showSpark = brews.filter((b) => b.rating != null && b.date != null).length >= 2;

  return (
    <View style={styles.card}>
      <View style={styles.stats}>
        <StatCell value={String(brews.length)} label="Cups" />
        <View style={styles.divider} />
        <StatCell value={totalGrams > 0 ? `${totalGrams}g` : '—'} label="Brewed" />
        <View style={styles.divider} />
        <StatCell value={medianRating != null ? medianRating.toFixed(1) : '—'} label="Median ☕️" />
        {showSpark && (
          <>
            <View style={styles.divider} />
            <SparkCell brews={brews} />
          </>
        )}
      </View>
    </View>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  statCell: { alignItems: 'center', gap: 4 },
  sparkCell: { width: 64, alignItems: 'stretch', gap: 4 },
  divider: { width: 0.5, height: 28, backgroundColor: colors.greyLight },
  statValue: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 17,
    color: colors.black,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
    textAlign: 'center',
  },

});
