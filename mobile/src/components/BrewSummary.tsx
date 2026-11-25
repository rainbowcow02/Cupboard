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

// The API reports an unrated cup as rating 0 (an empty Notion select has no
// ☕), not null. Ratings run 1–5, so only count positive ones — otherwise an
// unrated cup drags the median down and pulls the trend line to the floor.
function isRated(b: Brew): b is Brew & { rating: number } {
  return b.rating != null && b.rating > 0;
}

function SparkCell({ brews }: { brews: Brew[] }) {
  // `brews` arrives newest-first — the same order as the brew list on the bean
  // page — so reverse it for an oldest→newest line. Re-sorting by date here
  // scrambled same-day brews: dates are day-only, so ties kept the list's
  // newest-first order inside an otherwise oldest-first line.
  const rated = brews.filter(isRated).reverse();

  if (rated.length < 2) return null;

  // One point per rated cup, so the line traces the actual ratings. (Averaging
  // into a few buckets flattened real swings — 2,3,1,4,2,3,4,4 drew as a flat
  // 2.5,2.5,2.5,4 — and hid single highs like a lone 5.)
  const values = rated.map((b) => b.rating);

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

  const ratedBrews = brews.filter(isRated);
  const medianRating = (() => {
    if (ratedBrews.length === 0) return null;
    const sorted = [...ratedBrews].sort((a, b) => a.rating! - b.rating!);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1].rating! + sorted[mid].rating!) / 2
      : sorted[mid].rating!;
  })();

  const totalGrams = brews.reduce((sum, b) => sum + (b.beansG ?? 0), 0);
  const showSpark = ratedBrews.length >= 2;

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
