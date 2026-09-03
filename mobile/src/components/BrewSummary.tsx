import { StyleSheet, Text, View } from 'react-native';
import { Polyline, Svg } from 'react-native-svg';
import { Brew } from '@shared/lib/coffees';
import { colors, fonts, typography } from '@shared/theme';
import { Card } from './Card';
import { Divider } from './Divider';

interface Props {
  brews: Brew[];
}

const SPARK_H = 17;
const SPARK_W = 200;
const SPARK_PAD = 1.5;
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

  // Cap buckets at the number of ratings so no bucket is empty (an empty
  // slice averages to NaN, which makes the SVG polyline render nothing).
  const numBuckets = Math.min(BUCKETS, rated.length);
  const bucketSize = rated.length / numBuckets;
  const values = Array.from({ length: numBuckets }, (_, i) => {
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
      <Svg
        width={57}
        height={SPARK_H}
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        preserveAspectRatio="none"
      >
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.black}
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
    <Card style={styles.summary}>
      <View style={styles.stats}>
        <StatCell value={String(brews.length)} label="Cups" />
        <Divider orientation="vertical" length={53} thickness={0.5} opacity={1} />
        <StatCell value={totalGrams > 0 ? `${totalGrams}g` : '—'} label="Brewed" />
        <Divider orientation="vertical" length={53} thickness={0.5} opacity={1} />
        <StatCell value={medianRating != null ? `${medianRating.toFixed(1)} ☕️` : '—'} label="Median" />
        {showSpark && (
          <>
            <Divider orientation="vertical" length={53} thickness={0.5} opacity={1} />
            <SparkCell brews={brews} />
          </>
        )}
      </View>
    </Card>
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
  summary: {
    minHeight: 55,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statCell: {
    minWidth: 50,
    alignItems: 'center',
    gap: 4,
  },
  sparkCell: {
    width: 57,
    height: 53,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  statValue: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: typography.h3.fontSize,
    color: colors.black,
    letterSpacing: typography.h3.letterSpacing,
    lineHeight: typography.h3.lineHeight,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: typography.metadata.fontSize,
    color: colors.greyDark,
    lineHeight: typography.metadata.lineHeight,
    textAlign: 'center',
  },

});
