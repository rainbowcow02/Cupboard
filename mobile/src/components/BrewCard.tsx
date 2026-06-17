import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Brew, formatDate, parseRecipe } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { SortChevron } from './SortChevron';

const EXPAND_DURATION = 450;
const COLLAPSE_FADE_DURATION = 120;
const EXPAND_EASING = Easing.out(Easing.cubic);
const COLLAPSE_FADE_EASING = Easing.out(Easing.cubic);
const COLLAPSE_SPRING = { damping: 22, stiffness: 140, mass: 0.85 };

interface Props {
  brew: Brew;
  onEdit?: () => void;
}

interface ParsedReflections {
  thoughts: string;
  toTry: string;
}

function reflectionsText(brew: Brew): string | undefined {
  return brew.reflections?.trim() || brew.brewNotes?.trim() || undefined;
}

function parseReflections(text: string | undefined): ParsedReflections | null {
  if (!text?.trim()) return null;
  const thoughtsMatch = text.match(/Thoughts:\s*([\s\S]*?)(?=To Try:|$)/i);
  const toTryMatch = text.match(/To Try:\s*([\s\S]*)/i);
  if (thoughtsMatch || toTryMatch) {
    return {
      thoughts: thoughtsMatch?.[1]?.trim() ?? '',
      toTry: toTryMatch?.[1]?.trim() ?? '',
    };
  }
  return { thoughts: text.trim(), toTry: '' };
}

function parseToTryBullets(toTry: string): { intro: string; bullets: string[] } {
  const lines = toTry.split('\n').map((l) => l.trim()).filter(Boolean);
  const bullets: string[] = [];
  const introLines: string[] = [];
  for (const line of lines) {
    if (/^[-•*]\s/.test(line)) {
      bullets.push(line.replace(/^[-•*]\s*/, ''));
    } else if (bullets.length === 0) {
      introLines.push(line);
    }
  }
  return { intro: introLines.join('\n'), bullets };
}

function parseTastingNotes(text: string | undefined): { smell: string; taste: string; raw: boolean } {
  if (!text?.trim()) return { smell: '', taste: '', raw: false };
  const smellMatch = text.match(/Smell:\s*([\s\S]*?)(?=Taste:|$)/i);
  const tasteMatch = text.match(/Taste:\s*([\s\S]*)/i);
  if (!smellMatch && !tasteMatch) {
    return { smell: '', taste: text.trim(), raw: true };
  }
  return {
    smell: smellMatch?.[1]?.trim() ?? '',
    taste: tasteMatch?.[1]?.trim() ?? '',
    raw: false,
  };
}

function CupRating({ rating }: { rating?: number }) {
  if (!rating || rating <= 0) return null;
  const bg = rating >= 4 ? 'rgba(253,203,136,0.6)' : 'rgba(252,153,155,0.4)';
  const cups = '☕️'.repeat(rating);
  return (
    <View style={[styles.ratingPill, { backgroundColor: bg }]}>
      <Text style={styles.ratingText}>{cups}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.rowBlock}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
      <Divider />
    </View>
  );
}

function ExpandLink({ expanded, onPress }: { expanded: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.expandLink}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'See less' : 'See more'}
      accessibilityState={{ expanded }}
      accessibilityHint={
        expanded
          ? 'Collapses brew details'
          : 'Expands grinder, recipe, tasting notes, and reflections'
      }
    >
      <Text style={styles.expandLinkText}>{expanded ? 'See less' : 'See more'}</Text>
      <SortChevron
        flipped={expanded}
        color={colors.greyDark}
        duration={expanded ? EXPAND_DURATION : COLLAPSE_FADE_DURATION}
      />
    </Pressable>
  );
}

function useAccordionStyle(
  heightProgress: SharedValue<number>,
  contentFade: SharedValue<number>,
  contentHeight: SharedValue<number>,
) {
  return useAnimatedStyle(() => {
    const expandOpacity = interpolate(
      heightProgress.value,
      [0, 0.3, 0.75, 0.85, 1],
      [0, 0, 0.9, 1, 1],
    );
    const isCollapsing = contentFade.value < 1;
    return {
      height: contentHeight.value * heightProgress.value,
      opacity: isCollapsing ? contentFade.value : expandOpacity,
      transform: [{
        translateY: isCollapsing
          ? 0
          : interpolate(heightProgress.value, [0, 1], [-4, 0]),
      }],
    };
  });
}

function AccordionSection({
  heightProgress,
  contentFade,
  contentHeight,
  expanded,
  children,
}: {
  heightProgress: SharedValue<number>;
  contentFade: SharedValue<number>;
  contentHeight: SharedValue<number>;
  expanded: boolean;
  children: ReactNode;
}) {
  const accordionStyle = useAccordionStyle(heightProgress, contentFade, contentHeight);

  return (
    <Animated.View
      style={[styles.accordion, accordionStyle]}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
    >
      <View
        collapsable={false}
        style={styles.accordionContent}
        onLayout={(e) => {
          contentHeight.value = e.nativeEvent.layout.height;
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

function ThoughtHighlight({ thoughts }: { thoughts: string }) {
  return (
    <View style={styles.thoughtBlock}>
      <View style={styles.thoughtContainer}>
        <Text style={styles.thoughtContent} numberOfLines={2}>
          {thoughts}
        </Text>
      </View>
      <Divider />
    </View>
  );
}

function ReflectionsBody({ parsed }: { parsed: ParsedReflections }) {
  const { intro, bullets } = parseToTryBullets(parsed.toTry);
  return (
    <Text style={styles.bodyText}>
      <Text style={styles.bodyBold}>Thoughts:</Text>
      {'\n'}
      {parsed.thoughts}
      {parsed.toTry ? (
        <>
          {'\n\n'}
          <Text style={styles.bodyBold}>To Try:</Text>
          {'\n'}
          {intro}
          {bullets.map((bullet) => (
            <Text key={bullet}>
              {'\n'}• {bullet}
            </Text>
          ))}
        </>
      ) : null}
    </Text>
  );
}

function TastingNotesBody({ text }: { text: string }) {
  const parsed = parseTastingNotes(text);
  if (parsed.raw) {
    return <Text style={styles.bodyText}>{parsed.taste}</Text>;
  }
  return (
    <Text style={styles.bodyText}>
      {parsed.smell ? (
        <>
          <Text style={styles.bodyBold}>Smell:</Text>
          {` ${parsed.smell}`}
        </>
      ) : null}
      {parsed.smell && parsed.taste ? '\n\n' : null}
      {parsed.taste ? (
        <>
          <Text style={styles.bodyBold}>Taste:</Text>
          {` ${parsed.taste}`}
        </>
      ) : null}
    </Text>
  );
}

function NotesSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.notesSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.notesBody}>{children}</View>
      <Divider />
    </View>
  );
}

function NotesAndReflections({
  brew,
  reflections,
}: {
  brew: Brew;
  reflections: ParsedReflections | null;
}) {
  return (
    <>
      {brew.tastingNotes ? (
        <NotesSection title="Tasting notes">
          <TastingNotesBody text={brew.tastingNotes} />
        </NotesSection>
      ) : null}

      {reflections ? (
        <View style={styles.reflectionsSection}>
          <Text style={styles.sectionTitle}>Reflections</Text>
          <ReflectionsBody parsed={reflections} />
        </View>
      ) : null}
    </>
  );
}

function EquipmentAndRecipe({ brew, parsed }: { brew: Brew; parsed: ReturnType<typeof parseRecipe> }) {
  return (
    <>
      <View style={styles.insetDivider}>
        <Divider />
      </View>
      <Row label="Grinder" value={brew.grinder} />
      <Row label="Dripper" value={brew.brewer} />
      <Row label="Filter paper" value={brew.filter} />

      {parsed && parsed.pours.length > 0 ? (
        <>
          <Divider />
          <View style={styles.pourSection}>
            {parsed.pours.map(({ step, amount, technique }) => (
              <View key={step} style={styles.pourRow}>
                <Text style={styles.pourStep}>{step}</Text>
                <Text style={styles.pourAmount}>{amount}</Text>
                {technique ? <Text style={styles.pourTechnique}>{technique}</Text> : null}
              </View>
            ))}
            {parsed.agitation ? (
              <Text style={[styles.detailLabel, styles.agitation]}>{parsed.agitation}</Text>
            ) : null}
          </View>
          <Divider />
        </>
      ) : null}

      {!parsed && brew.recipeToTest ? (
        <>
          <Divider />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipe</Text>
            <Text style={styles.bodyText}>{brew.recipeToTest}</Text>
          </View>
          <Divider />
        </>
      ) : null}
    </>
  );
}

export function BrewCard({ brew, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const heightProgress = useSharedValue(0);
  const contentFade = useSharedValue(1);
  const topContentHeight = useSharedValue(0);
  const bottomContentHeight = useSharedValue(0);
  const allContentHeight = useSharedValue(0);

  useEffect(() => {
    if (expanded) {
      contentFade.value = 1;
      heightProgress.value = withTiming(1, {
        duration: EXPAND_DURATION,
        easing: EXPAND_EASING,
      });
      return;
    }

    contentFade.value = withTiming(0, {
      duration: COLLAPSE_FADE_DURATION,
      easing: COLLAPSE_FADE_EASING,
    });
    heightProgress.value = withDelay(
      COLLAPSE_FADE_DURATION,
      withSpring(0, COLLAPSE_SPRING),
    );
  }, [expanded, heightProgress, contentFade]);

  const hasRatio = brew.beansG && brew.waterMl;
  const ratio = hasRatio ? `1:${(brew.waterMl! / brew.beansG!).toFixed(1)}` : '—';
  const parsed = parseRecipe(brew.recipeToTest);
  const reflections = parseReflections(reflectionsText(brew));
  const brewTime = parsed?.brewTime;

  const hasExpandableContent = Boolean(
    brew.grinder ||
      brew.brewer ||
      brew.filter ||
      brew.recipeToTest ||
      brew.tastingNotes ||
      reflections,
  );

  return (
    <Pressable
      onLongPress={onEdit}
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Brew on ${formatDate(brew.date)}`}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(brew.date)}</Text>
        <CupRating rating={brew.rating} />
      </View>

      {reflections?.thoughts ? <ThoughtHighlight thoughts={reflections.thoughts} /> : null}

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

      {hasExpandableContent ? (
        brewTime ? (
          <>
            <AccordionSection
              heightProgress={heightProgress}
              contentFade={contentFade}
              contentHeight={topContentHeight}
              expanded={expanded}
            >
              <EquipmentAndRecipe brew={brew} parsed={parsed} />
            </AccordionSection>

            {!expanded ? (
              <View style={styles.insetDivider}>
                <Divider />
              </View>
            ) : null}
            <View style={[styles.rowBlock, !expanded ? styles.brewTimeRow : null]}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brew time</Text>
                <Text style={styles.statValue}>{brewTime}</Text>
              </View>
              {expanded ? <Divider /> : null}
            </View>

            <AccordionSection
              heightProgress={heightProgress}
              contentFade={contentFade}
              contentHeight={bottomContentHeight}
              expanded={expanded}
            >
              <NotesAndReflections brew={brew} reflections={reflections} />
            </AccordionSection>
          </>
        ) : (
          <AccordionSection
            heightProgress={heightProgress}
            contentFade={contentFade}
            contentHeight={allContentHeight}
            expanded={expanded}
          >
            <EquipmentAndRecipe brew={brew} parsed={parsed} />
            <NotesAndReflections brew={brew} reflections={reflections} />
          </AccordionSection>
        )
      ) : brewTime ? (
        <>
          <View style={styles.insetDivider}>
            <Divider />
          </View>
          <View style={[styles.rowBlock, styles.brewTimeRow]}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brew time</Text>
              <Text style={styles.statValue}>{brewTime}</Text>
            </View>
          </View>
        </>
      ) : null}

      {hasExpandableContent ? (
        <View style={styles.expandFooter}>
          <ExpandLink expanded={expanded} onPress={() => setExpanded((v) => !v)} />
        </View>
      ) : null}
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
  date: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 17,
    color: colors.black,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  ratingPill: { borderRadius: 100, padding: 8, alignItems: 'center', justifyContent: 'center' },
  ratingText: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  thoughtBlock: { paddingTop: 16, gap: 16
   },
  thoughtContainer: { paddingHorizontal: 24 },
  thoughtContent: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.burgundy,
    lineHeight: 22.5,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statCol: { alignItems: 'center', gap: 4 },
  statLabel: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
  },
  statValue: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 17,
    color: colors.black,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  divider: { height: 0.5, backgroundColor: '#E7E7E7' },
  insetDivider: { paddingHorizontal: 24 },
  rowBlock: { paddingTop: 16, paddingHorizontal: 24, gap: 16 },
  brewTimeRow: { paddingBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  detailLabel: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    flexShrink: 0,
    lineHeight: 20,
  },
  detailValue: {
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 15,
    color: colors.black,
    textAlign: 'right',
    lineHeight: 22,
    flex: 1,
  },
  pourSection: { paddingVertical: 16, paddingHorizontal: 24, gap: 0 },
  pourRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pourStep: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
    width: 50,
  },
  pourAmount: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 17,
    color: colors.black,
    letterSpacing: -0.5,
    lineHeight: 24,
    width: 60,
  },
  pourTechnique: {
    flex: 1,
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.black,
    lineHeight: 20,
  },
  agitation: { marginTop: 10},
  section: { padding: 16, paddingHorizontal: 24 },
  sectionTitle: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
    marginBottom: 8,
  },
  notesSection: { paddingTop: 16, paddingHorizontal: 24, gap: 8 },
  notesBody: { paddingBottom: 16 },
  reflectionsSection: { paddingHorizontal: 24, paddingVertical: 16, gap: 8 },
  bodyText: {
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 15,
    color: colors.black,
    lineHeight: 22.5,
  },
  bodyBold: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.black,
    lineHeight: 22.5,
  },
  expandFooter: { paddingTop: 8, paddingBottom: 16 },
  accordion: { overflow: 'hidden' },
  accordionContent: { position: 'absolute', left: 0, right: 0, top: 0 },
  expandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'stretch',
    paddingHorizontal: 24,
  },
  expandLinkText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    lineHeight: 21,
  },
});
