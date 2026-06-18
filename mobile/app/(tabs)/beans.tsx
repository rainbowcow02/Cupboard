import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { colors, fonts, surfaces } from '@shared/theme';
import { CupRating } from '../../src/components/CupRating';
import { PageHeader } from '../../src/components/PageHeader';
import { BottomChromeScrim } from '../../src/components/surfaces/BottomChromeScrim';
import { TAB_BAR_HEIGHT } from '../../src/components/TabBar';
import { useCoffees } from '../../src/hooks/useCoffees';

/*
 * Insights — Part 1 of the Coffee Insights & Passport PRD.
 * A personal coffee-identity dashboard built entirely from logged data.
 * Everything lives in this file by design (isolated vision prototype); shared
 * theme tokens are reused so it stays in parity with the rest of the app.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Tier helpers — derive a story from the user's real Coffee[] data
// ─────────────────────────────────────────────────────────────────────────────

type RoastBucket = 'Light' | 'Medium' | 'Dark';
const ROAST_BUCKETS: RoastBucket[] = ['Light', 'Medium', 'Dark'];

function bucketRoast(roast?: string): RoastBucket | null {
  if (!roast) return null;
  const r = roast.toLowerCase();
  if (r.includes('dark')) return 'Dark';
  if (r.includes('light')) return 'Light';
  if (r.includes('medium')) return 'Medium';
  return null;
}

function ratingOf(c: Coffee): number {
  return c.rating ?? 0;
}

const JUNK_VALUES = new Set(['not specified', 'unspecified', 'unknown', 'n/a', 'na', 'none', '-', '—', '']);

/** Normalise placeholder values ("Not specified", "Unknown", …) to undefined. */
function clean(v?: string | null): string | undefined {
  if (!v) return undefined;
  const trimmed = v.trim();
  return JUNK_VALUES.has(trimmed.toLowerCase()) ? undefined : trimmed;
}

/** Most frequent value across coffees, weighted by how much the user liked it. */
function weightedTop<T extends string>(
  coffees: Coffee[],
  pick: (c: Coffee) => T | undefined | null,
): T | null {
  const weights = new Map<T, number>();
  for (const c of coffees) {
    const value = pick(c);
    if (!value) continue;
    const weight = Math.max(1, ratingOf(c));
    weights.set(value, (weights.get(value) ?? 0) + weight);
  }
  let best: T | null = null;
  let bestWeight = -1;
  for (const [value, weight] of weights) {
    if (weight > bestWeight) {
      best = value;
      bestWeight = weight;
    }
  }
  return best;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function modeString(strings: string[]): string | null {
  const counts = new Map<string, number>();
  for (const s of strings) counts.set(s, (counts.get(s) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [s, count] of counts) {
    if (count > bestCount) {
      best = s;
      bestCount = count;
    }
  }
  return best;
}

function flagFor(origin?: string): string {
  return origin ? ORIGIN_FLAGS[origin] ?? '' : '';
}

// ── Flavor fingerprint ───────────────────────────────────────────────────────

interface FlavorAxis {
  key: string;
  words: string[];
}

const FLAVOR_AXES: FlavorAxis[] = [
  { key: 'Fruity', words: ['fruit', 'berry', 'blueberry', 'currant', 'raspberry', 'strawberry', 'peach', 'apricot', 'plum', 'cherry', 'nectarine', 'tropical', 'mango', 'grape', 'melon', 'apple', 'tomato'] },
  { key: 'Floral', words: ['floral', 'jasmine', 'bergamot', 'hibiscus', 'lavender', 'rose', 'blossom', 'verbena'] },
  { key: 'Citrus', words: ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'tangerine'] },
  { key: 'Sweet', words: ['sugar', 'caramel', 'honey', 'syrup', 'molasses', 'toffee', 'vanilla', 'sweet', 'candy'] },
  { key: 'Cocoa', words: ['chocolate', 'cocoa', 'cacao', 'mocha', 'fudge'] },
  { key: 'Nutty', words: ['nut', 'hazelnut', 'walnut', 'almond', 'peanut', 'pecan'] },
];

const FLAVOR_PHRASE: Record<string, string> = {
  Fruity: 'bright and fruity',
  Floral: 'delicate and floral',
  Citrus: 'zesty and citric',
  Sweet: 'sweet and syrupy',
  Cocoa: 'rich and chocolatey',
  Nutty: 'nutty and round',
};

interface FingerprintPoint {
  key: string;
  value: number; // 0..1, normalised to the strongest axis
}

function flavorFingerprint(coffees: Coffee[]): { points: FingerprintPoint[]; top: string | null } {
  const raw = FLAVOR_AXES.map((axis) => {
    let score = 0;
    for (const c of coffees) {
      const notes = c.notes?.toLowerCase();
      if (!notes) continue;
      if (axis.words.some((w) => notes.includes(w))) {
        score += Math.max(1, ratingOf(c));
      }
    }
    return { key: axis.key, score };
  });

  const max = Math.max(1, ...raw.map((r) => r.score));
  const points = raw.map((r) => ({
    key: r.key,
    value: r.score === 0 ? 0.06 : Math.max(0.14, r.score / max),
  }));
  const sorted = [...raw].sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ? sorted[0].key : null;
  return { points, top };
}

// ── Hero moment computations ─────────────────────────────────────────────────

interface Identity {
  sentence: string;
  tags: { label: string; value: string }[];
}

function computeIdentity(coffees: Coffee[], topFlavor: string | null): Identity {
  const loved = coffees.filter((c) => ratingOf(c) >= 4);
  const pool = loved.length >= 2 ? loved : coffees;

  const origin = weightedTop(pool, (c) => clean(c.origin));
  const roast = weightedTop(pool, (c) => bucketRoast(c.roastLevel));
  const process = weightedTop(pool, (c) => clean(c.process));
  const variety = weightedTop(pool, (c) => clean(c.variety));
  const flavorPhrase = topFlavor ? FLAVOR_PHRASE[topFlavor] : 'balanced and easy-drinking';

  const lead: string[] = [];
  if (process) lead.push(`${process.toLowerCase()}-process`);
  if (origin) lead.push(origin);
  if (roast) lead.push(`${roast.toLowerCase()} roast`);

  const sentence = lead.length
    ? `You're a ${lead.join(', ')} person — ${flavorPhrase} is your sweet spot.`
    : `Keep logging and your taste portrait will start to take shape here.`;

  const tags: { label: string; value: string }[] = [];
  if (origin) tags.push({ label: 'Origin', value: `${flagFor(origin)} ${origin}`.trim() });
  if (roast) tags.push({ label: 'Roast', value: roast });
  if (process) tags.push({ label: 'Process', value: process });
  if (variety) tags.push({ label: 'Varietal', value: variety });

  return { sentence, tags };
}

interface SweetSpot {
  sentence: string;
  ratio: string;
  grind: string;
  temp: string;
}

function computeSweetSpot(coffees: Coffee[]): SweetSpot | null {
  const brews = coffees.flatMap((c) =>
    c.brews.map((b) => ({ ...b, roastBucket: bucketRoast(c.roastLevel) })),
  );
  if (brews.length === 0) return null;

  const loved = brews.filter((b) => (b.rating ?? 0) >= 4);
  const pool = loved.length >= 2 ? loved : brews;

  const ratios = pool
    .filter((b) => b.beansG && b.waterMl)
    .map((b) => b.waterMl! / b.beansG!);
  const ratioMedian = median(ratios);
  const ratio = ratioMedian ? `1:${ratioMedian.toFixed(1)}` : '1:16.0';

  const grind = modeString(pool.map((b) => clean(b.grind)).filter((g): g is string => !!g)) ?? 'Medium-fine';
  const tempMedian = median(pool.map((b) => b.tempC).filter((t): t is number => !!t));
  const temp = tempMedian ? `${Math.round(tempMedian)}°C` : '94°C';
  const roast = (modeString(pool.map((b) => b.roastBucket).filter((r): r is RoastBucket => !!r)) ?? 'light').toLowerCase();

  const sentence = `Your highest-rated cups land around a ${ratio} ratio at ${temp}, ${grind.toLowerCase()} grind. Start there on a ${roast} roast and pour gently — that combination is where your scores climb.`;

  return { sentence, ratio, grind, temp };
}

interface Trend {
  sentence: string;
  spark: number[];
  direction: 'up' | 'down' | 'steady';
}

const LIGHTNESS: Record<RoastBucket, number> = { Light: 2, Medium: 1, Dark: 0 };

function computeTrend(coffees: Coffee[]): Trend {
  // groupIntoCoffees returns most-recent-first; reverse to chronological.
  const chrono = [...coffees].reverse();
  const spark = chrono.map((c) => ratingOf(c)).filter((r) => r > 0);

  const half = Math.floor(chrono.length / 2);
  const older = chrono.slice(0, half);
  const recent = chrono.slice(half);

  const avgLight = (list: Coffee[]) => {
    const vals = list
      .map((c) => bucketRoast(c.roastLevel))
      .filter((b): b is RoastBucket => !!b)
      .map((b) => LIGHTNESS[b]);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const avgRating = (list: Coffee[]) => {
    const vals = list.map(ratingOf).filter((r) => r > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const lightOld = avgLight(older);
  const lightNew = avgLight(recent);
  const ratingOld = avgRating(older);
  const ratingNew = avgRating(recent);

  if (lightOld != null && lightNew != null && lightNew - lightOld > 0.35) {
    return {
      sentence: `Lately you're drifting lighter — your recent pours lean brighter and more delicate than they did a few months back.`,
      spark,
      direction: 'up',
    };
  }
  if (lightOld != null && lightNew != null && lightOld - lightNew > 0.35) {
    return {
      sentence: `You've been reaching for deeper roasts recently — cozier, rounder cups are having a moment in your cupboard.`,
      spark,
      direction: 'down',
    };
  }
  if (ratingOld != null && ratingNew != null && ratingNew - ratingOld > 0.4) {
    return {
      sentence: `Your ratings are trending up — you're getting better at dialing in recipes that genuinely work for you.`,
      spark,
      direction: 'up',
    };
  }
  return {
    sentence: `Your taste is steady and sure — you know what you like, and you keep finding your way back to it.`,
    spark,
    direction: 'steady',
  };
}

// ── Top recipes by roast ─────────────────────────────────────────────────────

interface RecipeItem {
  coffeeId: string;
  bean: string;
  roaster: string;
  rating: number;
  ratio: string;
  grind: string;
  temp: string;
  note: string;
}

function firstNote(notes?: string): string {
  if (!notes) return '';
  return notes.split(/[,;]/)[0].trim();
}

function recipeFor(coffee: Coffee): RecipeItem | null {
  const candidates = coffee.brews.filter((b) => b.beansG && b.waterMl);
  if (candidates.length === 0) return null;
  const best = [...candidates].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
  return {
    coffeeId: coffee.id,
    bean: coffee.bean,
    roaster: coffee.roaster,
    rating: Math.max(coffee.rating ?? 0, best.rating ?? 0),
    ratio: `1:${(best.waterMl! / best.beansG!).toFixed(1)}`,
    grind: clean(best.grind) ?? '—',
    temp: best.tempC ? `${best.tempC}°C` : '—',
    note: firstNote(coffee.notes),
  };
}

function topRecipesByRoast(coffees: Coffee[]): Record<RoastBucket, RecipeItem[]> {
  const result: Record<RoastBucket, RecipeItem[]> = { Light: [], Medium: [], Dark: [] };
  for (const bucket of ROAST_BUCKETS) {
    const items = coffees
      .filter((c) => bucketRoast(c.roastLevel) === bucket)
      .map(recipeFor)
      .filter((r): r is RecipeItem => r !== null)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
    result[bucket] = items;
  }
  return result;
}

interface BaselineRecipe {
  ratio: string;
  grind: string;
  temp: string;
  note: string;
}

const BASELINE: Record<RoastBucket, BaselineRecipe> = {
  Light: { ratio: '1:16.7', grind: 'Medium-fine', temp: '94°C', note: 'Bright & floral' },
  Medium: { ratio: '1:16.0', grind: 'Medium', temp: '92°C', note: 'Balanced & sweet' },
  Dark: { ratio: '1:15.0', grind: 'Medium-coarse', temp: '88°C', note: 'Rich & rounded' },
};

const ROAST_ACCENT: Record<RoastBucket, string> = {
  Light: colors.chardonnay,
  Medium: colors.supremeBeige,
  Dark: colors.burgundy,
};

// ── Stats shelf computations ─────────────────────────────────────────────────

interface CountStat {
  label: string;
  count: number;
  avg: number;
}

function groupStat(coffees: Coffee[], pick: (c: Coffee) => string | undefined | null): CountStat[] {
  const map = new Map<string, { count: number; ratingSum: number; ratingN: number }>();
  for (const c of coffees) {
    const key = pick(c);
    if (!key) continue;
    const entry = map.get(key) ?? { count: 0, ratingSum: 0, ratingN: 0 };
    entry.count += 1;
    if (ratingOf(c) > 0) {
      entry.ratingSum += ratingOf(c);
      entry.ratingN += 1;
    }
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([label, e]) => ({ label, count: e.count, avg: e.ratingN ? e.ratingSum / e.ratingN : 0 }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg);
}

interface RoastShare {
  bucket: RoastBucket;
  count: number;
  share: number;
}

function roastDistribution(coffees: Coffee[]): RoastShare[] {
  const counts: Record<RoastBucket, number> = { Light: 0, Medium: 0, Dark: 0 };
  let total = 0;
  for (const c of coffees) {
    const b = bucketRoast(c.roastLevel);
    if (!b) continue;
    counts[b] += 1;
    total += 1;
  }
  return ROAST_BUCKETS.map((bucket) => ({
    bucket,
    count: counts[bucket],
    share: total ? counts[bucket] / total : 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children, color }: { children: string; color?: string }) {
  return <Text style={[styles.eyebrow, color ? { color } : null]}>{children}</Text>;
}

function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={styles.sectionHeader} accessibilityRole="header">
      <Text style={styles.sectionTitle}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </View>
  );
}

const BAR_EASING = Easing.out(Easing.cubic);

function StatBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [trackW, setTrackW] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(pct, { duration: 850, easing: BAR_EASING }));
  }, [pct, delay, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: trackW * progress.value }));

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  return (
    <View style={styles.barTrack} onLayout={onLayout}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

function StatPanel({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.panel}>
      {children}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 1 — Hero Moments carousel
// ─────────────────────────────────────────────────────────────────────────────

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 200;
  const h = 38;
  const max = 5;
  const min = 1;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HeroIdentityCard({ identity, width }: { identity: Identity; width: number }) {
  return (
    <View style={[styles.heroCard, styles.heroIdentity, { width }]} accessibilityRole="summary">
      <Eyebrow color="rgba(249,237,221,0.7)">YOUR COFFEE IDENTITY</Eyebrow>
      <Text style={styles.heroIdentityText}>{identity.sentence}</Text>
      {identity.tags.length > 0 && (
        <View style={styles.tagRow}>
          {identity.tags.map((t) => (
            <View key={t.label} style={styles.tagPill}>
              <Text style={styles.tagValue}>{t.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function HeroSweetSpotCard({ sweetSpot, width }: { sweetSpot: SweetSpot; width: number }) {
  return (
    <View style={[styles.heroCard, styles.heroSweet, { width }]} accessibilityRole="summary">
      <Eyebrow color="rgba(249,237,221,0.75)">YOUR BREW SWEET SPOT</Eyebrow>
      <Text style={styles.heroSweetText}>{sweetSpot.sentence}</Text>
      <View style={styles.sweetStatRow}>
        {[
          { label: 'Ratio', value: sweetSpot.ratio },
          { label: 'Grind', value: sweetSpot.grind },
          { label: 'Temp', value: sweetSpot.temp },
        ].map((s) => (
          <View key={s.label} style={styles.sweetStat}>
            <Text style={styles.sweetStatValue}>{s.value}</Text>
            <Text style={styles.sweetStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const TREND_GLYPH: Record<Trend['direction'], string> = { up: '↗', down: '↘', steady: '→' };

function HeroTrendCard({ trend, width }: { trend: Trend; width: number }) {
  return (
    <View style={[styles.heroCard, styles.heroTrend, { width }]} accessibilityRole="summary">
      <View style={styles.trendEyebrowRow}>
        <Eyebrow color="rgba(0,0,0,0.5)">ONE TREND</Eyebrow>
        <Text style={styles.trendGlyph}>{TREND_GLYPH[trend.direction]}</Text>
      </View>
      <Text style={styles.heroTrendText}>{trend.sentence}</Text>
      <View style={styles.sparkWrap}>
        <Spark values={trend.spark} color={colors.burgundy} />
        <Text style={styles.sparkCaption}>Your ratings over time</Text>
      </View>
    </View>
  );
}

function PageDot({ index, scrollX, itemW }: { index: number; scrollX: Animated.SharedValue<number>; itemW: number }) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * itemW, index * itemW, (index + 1) * itemW];
    return {
      width: interpolate(scrollX.value, input, [7, 20, 7], 'clamp'),
      opacity: interpolate(scrollX.value, input, [0.3, 1, 0.3], 'clamp'),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

function HeroCarousel({
  identity,
  sweetSpot,
  trend,
}: {
  identity: Identity;
  sweetSpot: SweetSpot | null;
  trend: Trend;
}) {
  const { width } = useWindowDimensions();
  const cardW = width - 48;
  const gap = 14;
  const itemW = cardW + gap;
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const cards = [
    <HeroIdentityCard key="identity" identity={identity} width={cardW} />,
    sweetSpot ? <HeroSweetSpotCard key="sweet" sweetSpot={sweetSpot} width={cardW} /> : null,
    <HeroTrendCard key="trend" trend={trend} width={cardW} />,
  ].filter(Boolean) as React.ReactNode[];

  return (
    <View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemW}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {cards.map((card, i) => (
          <View key={i} style={{ marginRight: i === cards.length - 1 ? 0 : gap }}>
            {card}
          </View>
        ))}
      </Animated.ScrollView>
      <View style={styles.dotsRow}>
        {cards.map((_, i) => (
          <PageDot key={i} index={i} scrollX={scrollX} itemW={itemW} />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Passport-style stat strip
// ─────────────────────────────────────────────────────────────────────────────

function StatStrip({ items }: { items: { value: string; label: string }[] }) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.strip}>
      {items.map((s, i) => (
        <View key={s.label} style={styles.stripItem}>
          {i > 0 && <View style={styles.stripDivider} />}
          <Text style={styles.stripValue}>{s.value}</Text>
          <Text style={styles.stripLabel}>{s.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 2 — Top recipes by roast
// ─────────────────────────────────────────────────────────────────────────────

function RecipeStatTrio({ ratio, grind, temp, muted }: { ratio: string; grind: string; temp: string; muted?: boolean }) {
  return (
    <View style={styles.recipeStatRow}>
      {[
        { label: 'Ratio', value: ratio },
        { label: 'Grind', value: grind },
        { label: 'Temp', value: temp },
      ].map((s) => (
        <View key={s.label} style={styles.recipeStat}>
          <Text style={[styles.recipeStatValue, muted && styles.mutedInk]}>{s.value}</Text>
          <Text style={styles.recipeStatLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

function RecipeCard({ item, accent, onPress }: { item: RecipeItem; accent: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.recipeCard, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.bean} by ${item.roaster}, rated ${Math.round(item.rating)} cups`}
    >
      <View style={styles.recipeHeader}>
        <View style={[styles.accentDot, { backgroundColor: accent }]} />
        <CupRating rating={item.rating} />
      </View>
      <Text style={styles.recipeBean} numberOfLines={2}>{item.bean}</Text>
      <Text style={styles.recipeRoaster} numberOfLines={1}>{item.roaster}</Text>
      <RecipeStatTrio ratio={item.ratio} grind={item.grind} temp={item.temp} />
      {item.note ? <Text style={styles.recipeNote} numberOfLines={1}>{item.note}</Text> : null}
    </Pressable>
  );
}

function BaselineCard({ bucket }: { bucket: RoastBucket }) {
  const b = BASELINE[bucket];
  return (
    <View style={styles.baselineCard} accessibilityRole="summary" accessibilityLabel={`Suggested starting point for ${bucket} roast`}>
      <View style={styles.recipeHeader}>
        <Text style={styles.baselineBadge}>SUGGESTED START</Text>
      </View>
      <Text style={[styles.recipeBean, styles.mutedInk]} numberOfLines={2}>{bucket} baseline</Text>
      <Text style={styles.recipeRoaster} numberOfLines={1}>A solid place to begin</Text>
      <RecipeStatTrio ratio={b.ratio} grind={b.grind} temp={b.temp} muted />
      <Text style={[styles.recipeNote, styles.mutedInk]} numberOfLines={1}>{b.note}</Text>
    </View>
  );
}

function RoastRow({
  bucket,
  recipes,
  delay,
  onPressRecipe,
}: {
  bucket: RoastBucket;
  recipes: RecipeItem[];
  delay: number;
  onPressRecipe: (id: string) => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.roastRow}>
      <View style={styles.roastLabelRow}>
        <View style={[styles.roastSwatch, { backgroundColor: ROAST_ACCENT[bucket] }]} />
        <Text style={styles.roastLabel}>{bucket} roast</Text>
        <Text style={styles.roastCount}>{recipes.length || '—'}</Text>
      </View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
      >
        {recipes.map((r) => (
          <RecipeCard key={r.coffeeId} item={r} accent={ROAST_ACCENT[bucket]} onPress={() => onPressRecipe(r.coffeeId)} />
        ))}
        <BaselineCard bucket={bucket} />
      </Animated.ScrollView>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 3 — Stats shelf
// ─────────────────────────────────────────────────────────────────────────────

function RadarChart({ points }: { points: FingerprintPoint[] }) {
  const size = 230;
  const center = size / 2;
  const radius = size / 2 - 34;
  const n = points.length;

  const angleFor = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const coord = (i: number, r: number) => ({
    x: center + r * Math.cos(angleFor(i)),
    y: center + r * Math.sin(angleFor(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const valuePoints = points
    .map((p, i) => {
      const { x, y } = coord(i, radius * p.value);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <Animated.View entering={FadeIn.duration(700)} style={styles.radarWrap}>
      <Svg width={size} height={size}>
        {rings.map((ring) => {
          const ringPoints = points
            .map((_, i) => {
              const { x, y } = coord(i, radius * ring);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          return <Polygon key={ring} points={ringPoints} fill="none" stroke={surfaces.divider} strokeWidth={1} />;
        })}
        {points.map((_, i) => {
          const { x, y } = coord(i, radius);
          return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke={surfaces.divider} strokeWidth={1} />;
        })}
        <Polygon points={valuePoints} fill={`${colors.moss}55`} stroke={colors.moss} strokeWidth={2} />
        {points.map((p, i) => {
          const { x, y } = coord(i, radius * p.value);
          return <Circle key={p.key} cx={x} cy={y} r={3} fill={colors.moss} />;
        })}
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {points.map((p, i) => {
          const { x, y } = coord(i, radius + 18);
          return (
            <Text
              key={p.key}
              style={[styles.radarLabel, { left: x - 40, top: y - 8, width: 80 }]}
            >
              {p.key}
            </Text>
          );
        })}
      </View>
    </Animated.View>
  );
}

function RankedBarList({ stats, max, accent, showAvg }: { stats: CountStat[]; max: number; accent: string; showAvg?: boolean }) {
  return (
    <View style={styles.rankList}>
      {stats.map((s, i) => (
        <View key={s.label} style={styles.rankRow}>
          <View style={styles.rankLabelRow}>
            <Text style={styles.rankLabel} numberOfLines={1}>{s.label}</Text>
            <Text style={styles.rankMeta}>
              {s.count}
              {showAvg && s.avg ? `  ·  ${s.avg.toFixed(1)}★` : ''}
            </Text>
          </View>
          <StatBar pct={max ? s.count / max : 0} color={accent} delay={i * 70} />
        </View>
      ))}
    </View>
  );
}

function OriginList({ stats, max }: { stats: CountStat[]; max: number }) {
  return (
    <View style={styles.rankList}>
      {stats.map((s, i) => (
        <View key={s.label} style={styles.rankRow}>
          <View style={styles.rankLabelRow}>
            <Text style={styles.rankLabel} numberOfLines={1}>
              {flagFor(s.label)} {s.label}
            </Text>
            <Text style={styles.rankMeta}>{s.count} bag{s.count !== 1 ? 's' : ''}{s.avg ? `  ·  ${s.avg.toFixed(1)}★` : ''}</Text>
          </View>
          <StatBar pct={max ? s.count / max : 0} color={colors.moss} delay={i * 70} />
        </View>
      ))}
    </View>
  );
}

function RoastDistribution({ shares }: { shares: RoastShare[] }) {
  const hasData = shares.some((s) => s.count > 0);
  return (
    <View>
      <View style={styles.stackedBar}>
        {hasData &&
          shares.map((s) =>
            s.share > 0 ? (
              <View key={s.bucket} style={{ flex: s.share, backgroundColor: ROAST_ACCENT[s.bucket] }} />
            ) : null,
          )}
      </View>
      <View style={styles.legendRow}>
        {shares.map((s) => (
          <View key={s.bucket} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: ROAST_ACCENT[s.bucket] }]} />
            <Text style={styles.legendLabel}>{s.bucket}</Text>
            <Text style={styles.legendPct}>{Math.round(s.share * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ChipWrap({ stats }: { stats: CountStat[] }) {
  return (
    <View style={styles.chipWrap}>
      {stats.map((s) => (
        <View key={s.label} style={styles.chip}>
          <Text style={styles.chipText}>{s.label}</Text>
          {s.avg ? <Text style={styles.chipMeta}>{s.avg.toFixed(1)}★</Text> : null}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparse / empty state
// ─────────────────────────────────────────────────────────────────────────────

function SparseState() {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.sparseWrap}>
      <Text style={styles.sparseEmoji}>☕️</Text>
      <Text style={styles.sparseTitle}>Your coffee story starts here</Text>
      <Text style={styles.sparseBody}>
        Log a few more cups and Cupboard will reflect your taste back to you — your identity, your sweet-spot recipe,
        and how your palate is evolving. In the meantime, here are some baseline recipes to get a great pour started.
      </Text>
      <View style={styles.sparseRecipes}>
        {ROAST_BUCKETS.map((b) => (
          <BaselineCard key={b} bucket={b} />
        ))}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

const MIN_RATED_FOR_INSIGHTS = 3;

export default function BeansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { coffees } = useCoffees();

  const insights = useMemo(() => {
    const fingerprint = flavorFingerprint(coffees);
    return {
      fingerprint,
      identity: computeIdentity(coffees, fingerprint.top),
      sweetSpot: computeSweetSpot(coffees),
      trend: computeTrend(coffees),
      recipes: topRecipesByRoast(coffees),
      origins: groupStat(coffees, (c) => clean(c.origin)),
      processes: groupStat(coffees, (c) => clean(c.process)),
      varietals: groupStat(coffees, (c) => clean(c.variety)),
      roasters: groupStat(coffees, (c) => clean(c.roaster)),
      roastDist: roastDistribution(coffees),
    };
  }, [coffees]);

  const ratedCount = useMemo(() => coffees.filter((c) => ratingOf(c) > 0).length, [coffees]);
  const hasEnoughData = ratedCount >= MIN_RATED_FOR_INSIGHTS;

  const totalCups = useMemo(
    () => coffees.reduce((sum, c) => sum + c.brews.length, 0),
    [coffees],
  );
  const countries = useMemo(
    () => new Set(coffees.map((c) => clean(c.origin)).filter(Boolean)).size,
    [coffees],
  );
  const avgRating = useMemo(() => {
    const rated = coffees.filter((c) => ratingOf(c) > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((s, c) => s + ratingOf(c), 0) / rated.length;
  }, [coffees]);

  const onPressRecipe = (id: string) => router.push(`/coffee/${encodeURIComponent(id)}`);

  const maxOrigin = Math.max(1, ...insights.origins.map((s) => s.count));
  const maxProcess = Math.max(1, ...insights.processes.map((s) => s.count));

  return (
    <SafeAreaView style={styles.container}>
      <BottomChromeScrim />
      <PageHeader
        title="Insights"
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
          contentContainerStyle: { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24 },
        }}
      >
        {!hasEnoughData ? (
          <SparseState />
        ) : (
          <>
            {/* Tier 1 — Hero moments */}
            <Animated.View entering={FadeInDown.duration(500)}>
              <HeroCarousel identity={insights.identity} sweetSpot={insights.sweetSpot} trend={insights.trend} />
            </Animated.View>

            {/* Passport-style quick stats */}
            <StatStrip
              items={[
                { value: String(totalCups), label: 'cups' },
                { value: String(coffees.length), label: 'beans' },
                { value: String(countries), label: 'origins' },
                { value: avgRating.toFixed(1), label: 'avg ★' },
              ]}
            />

            {/* Tier 2 — Top recipes by roast */}
            <SectionHeader title="Top recipes" caption="Your best-rated pours, grouped by roast — with a baseline to fill the gaps." />
            {ROAST_BUCKETS.map((bucket, i) => (
              <RoastRow
                key={bucket}
                bucket={bucket}
                recipes={insights.recipes[bucket]}
                delay={i * 80}
                onPressRecipe={onPressRecipe}
              />
            ))}

            {/* Tier 3 — Stats shelf */}
            <SectionHeader title="Your shelf" caption="The supporting detail behind the story." />
            <View style={styles.shelf}>
              <StatPanel>
                <Text style={styles.panelTitle}>Flavor fingerprint</Text>
                <Text style={styles.panelCaption}>The notes you reach for most</Text>
                <RadarChart points={insights.fingerprint.points} />
              </StatPanel>

              <StatPanel delay={60}>
                <Text style={styles.panelTitle}>Roast distribution</Text>
                <Text style={styles.panelCaption}>How your shelf splits by roast</Text>
                <RoastDistribution shares={insights.roastDist} />
              </StatPanel>

              <StatPanel delay={120}>
                <Text style={styles.panelTitle}>Origins</Text>
                <Text style={styles.panelCaption}>Where your coffee comes from</Text>
                <OriginList stats={insights.origins} max={maxOrigin} />
              </StatPanel>

              <StatPanel delay={180}>
                <Text style={styles.panelTitle}>Process</Text>
                <Text style={styles.panelCaption}>Bag count and average rating</Text>
                <RankedBarList stats={insights.processes} max={maxProcess} accent={colors.supremeBeige} showAvg />
              </StatPanel>

              {insights.varietals.length > 0 && (
                <StatPanel delay={240}>
                  <Text style={styles.panelTitle}>Varietals tried</Text>
                  <Text style={styles.panelCaption}>Cultivars in your cupboard</Text>
                  <ChipWrap stats={insights.varietals} />
                </StatPanel>
              )}

              {insights.roasters.length > 0 && (
                <StatPanel delay={300}>
                  <Text style={styles.panelTitle}>Favorite roasters</Text>
                  <Text style={styles.panelCaption}>Who keeps showing up</Text>
                  <RankedBarList stats={insights.roasters.slice(0, 5)} max={Math.max(1, ...insights.roasters.map((s) => s.count))} accent={colors.blossomPink} showAvg />
                </StatPanel>
              )}
            </View>
          </>
        )}
      </PageHeader>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const GUTTER = 24;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pearl },

  // Shared text
  eyebrow: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.greyDark,
  },
  mutedInk: { color: colors.greyDark },

  // Section headers
  sectionHeader: { paddingHorizontal: GUTTER, marginTop: 36, marginBottom: 16 },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.black,
    letterSpacing: -0.5,
  },
  sectionCaption: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    marginTop: 4,
    lineHeight: 19,
  },

  // Hero carousel — generous vertical padding so the card shadow isn't
  // clipped by the horizontal ScrollView's vertical bounds (the soft shadow
  // spreads ~38px below the card, and the tallest card defines the height).
  carouselContent: { paddingHorizontal: GUTTER, paddingTop: 16, paddingBottom: 44 },
  heroCard: {
    borderRadius: surfaces.cardRadius,
    padding: 26,
    minHeight: 220,
    justifyContent: 'space-between',
    ...surfaces.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  heroIdentity: { backgroundColor: colors.burgundy },
  heroIdentityText: {
    fontFamily: fonts.serif,
    fontSize: 27,
    lineHeight: 35,
    color: colors.pearl,
    letterSpacing: -0.5,
    marginTop: 14,
  },
  heroSweet: { backgroundColor: colors.moss },
  heroSweetText: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 25,
    color: colors.pearl,
    marginTop: 14,
  },
  heroTrend: { backgroundColor: colors.chardonnay },
  trendEyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendGlyph: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 20, color: colors.burgundy },
  heroTrendText: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 30,
    color: colors.black,
    letterSpacing: -0.4,
    marginTop: 12,
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  tagPill: {
    backgroundColor: 'rgba(249,237,221,0.18)',
    borderRadius: surfaces.pillRadius,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  tagValue: { fontFamily: fonts.sans, fontWeight: '700', fontSize: 12.5, color: colors.pearl },

  sweetStatRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  sweetStat: {
    flex: 1,
    backgroundColor: 'rgba(249,237,221,0.14)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  sweetStatValue: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 16, color: colors.pearl },
  sweetStatLabel: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 11, color: 'rgba(249,237,221,0.7)', letterSpacing: 0.5 },

  sparkWrap: { marginTop: 18 },
  sparkCaption: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 6, letterSpacing: 0.3 },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: -12 },
  dot: { height: 7, borderRadius: 4, backgroundColor: colors.burgundy },

  // Stat strip
  strip: {
    flexDirection: 'row',
    marginHorizontal: GUTTER,
    marginTop: 22,
    backgroundColor: surfaces.cardFill,
    borderRadius: 22,
    paddingVertical: 16,
  },
  stripItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stripDivider: { position: 'absolute', left: 0, top: 4, bottom: 4, width: StyleSheet.hairlineWidth, backgroundColor: surfaces.divider },
  stripValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.black, letterSpacing: -0.5 },
  stripLabel: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 11, color: colors.greyDark, letterSpacing: 0.4, marginTop: 2 },

  // Recipe rows
  roastRow: { marginBottom: 6 },
  roastLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: GUTTER, marginBottom: 4 },
  roastSwatch: { width: 12, height: 12, borderRadius: 6 },
  roastLabel: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 15, color: colors.black, letterSpacing: -0.2 },
  roastCount: { fontFamily: fonts.sans, fontWeight: '700', fontSize: 13, color: colors.greyDark },
  // Vertical padding gives the recipe-card shadow (offset 8, radius 18) room
  // to render without being clipped by the horizontal ScrollView's bounds.
  rowContent: { paddingHorizontal: GUTTER, gap: 12, paddingTop: 8, paddingBottom: 28 },

  recipeCard: {
    width: 208,
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 20,
    gap: 6,
    ...surfaces.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  cardPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, minHeight: 18 },
  accentDot: { width: 9, height: 9, borderRadius: 5 },
  recipeBean: { fontFamily: fonts.condensed, fontWeight: '600', fontSize: 20, color: colors.black, letterSpacing: -0.4, lineHeight: 24 },
  recipeRoaster: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 11, color: colors.greyDark, textTransform: 'uppercase', letterSpacing: 0.6 },
  recipeStatRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 },
  recipeStat: { alignItems: 'flex-start', gap: 2 },
  recipeStatValue: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 14, color: colors.black },
  recipeStatLabel: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 10, color: colors.greyDark, letterSpacing: 0.3 },
  recipeNote: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 12.5, color: colors.moss, fontStyle: 'italic' },

  baselineCard: {
    width: 208,
    backgroundColor: 'rgba(204,166,140,0.12)',
    borderRadius: 26,
    padding: 20,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(204,166,140,0.5)',
    borderStyle: 'dashed',
  },
  baselineBadge: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 9.5, letterSpacing: 1, color: colors.supremeBeige },

  // Stats shelf
  shelf: { paddingHorizontal: GUTTER, gap: 14 },
  panel: { backgroundColor: surfaces.cardFill, borderRadius: 26, padding: 20 },
  panelTitle: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 16, color: colors.black, letterSpacing: -0.2 },
  panelCaption: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 12.5, color: colors.greyDark, marginTop: 2, marginBottom: 16 },

  // Radar
  radarWrap: { alignItems: 'center', justifyContent: 'center', height: 230, marginTop: 4 },
  radarLabel: { position: 'absolute', textAlign: 'center', fontFamily: fonts.sans, fontWeight: '700', fontSize: 11, color: colors.greyDark },

  // Ranked bars
  rankList: { gap: 14 },
  rankRow: { gap: 6 },
  rankLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  rankLabel: { fontFamily: fonts.sans, fontWeight: '700', fontSize: 14, color: colors.black, flex: 1, marginRight: 8 },
  rankMeta: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 12, color: colors.greyDark },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },

  // Roast distribution
  stackedBar: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 12.5, color: colors.black },
  legendPct: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 12.5, color: colors.greyDark },

  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: surfaces.pillRadius,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: { fontFamily: fonts.sans, fontWeight: '700', fontSize: 13, color: colors.black },
  chipMeta: { fontFamily: fonts.sans, fontWeight: '700', fontSize: 11.5, color: colors.moss },

  // Sparse state
  sparseWrap: { paddingHorizontal: GUTTER, paddingTop: 24, alignItems: 'center' },
  sparseEmoji: { fontSize: 44, marginBottom: 12 },
  sparseTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.black, letterSpacing: -0.5, textAlign: 'center' },
  sparseBody: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.greyDark,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  sparseRecipes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
});
