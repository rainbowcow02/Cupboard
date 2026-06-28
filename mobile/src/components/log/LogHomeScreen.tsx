import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  CellRendererProps,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, formatDate, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { colors, fonts, surfaces } from '@shared/theme';
import { Bag } from '../Bag';
import { Card } from '../Card';
import { SearchIcon } from '../SearchIcon';
import { BottomChromeScrim } from '../surfaces/BottomChromeScrim';
import { TAB_BAR_HEIGHT } from '../TabBar';

interface Props {
  coffees: Coffee[];
  onSelectCoffee: (coffee: Coffee) => void;
  onAddNew: () => void;
}

/**
 * Default Log tab screen: the cupboard list is the home. Tapping a bean starts
 * an iteration; "Add" (subtle, top-right) starts a new bean. A search pill sits
 * directly under the title, scrolling with the list header.
 */
// Vertical breathing room above the brewing CTA, and the gap before the list
// begins. Kept as constants so the fade threshold can be derived from them.
const CTA_PADDING_TOP = 100;
const CTA_PADDING_BOTTOM = 16;

// Number of sampled stops used to approximate an ease-in-out curve on the
// scroll-linked CTA fade (RN's interpolate is linear between stops).
const CTA_FADE_STEPS = 8;
const easeInOut = Easing.inOut(Easing.ease);

// How far (px) above the list's top edge a card begins fading before it clips
// off — roughly one card height, so the fade reads as the card exiting.
const CARD_FADE_DISTANCE = 100;

interface FadingCellProps extends CellRendererProps<Coffee> {
  scrollY: Animated.Value;
}

/**
 * FlatList cell wrapper that fades each row 100% → 80% → 40% as it nears and
 * exits the top edge of the list. The cell's onLayout y is its content offset;
 * we MUST chain the incoming onLayout so VirtualizedList keeps measuring cell
 * heights (otherwise windowing and scrollToIndex break).
 */
function FadingCell({ scrollY, onLayout, style, children }: FadingCellProps) {
  const [y, setY] = useState<number | null>(null);
  const handleLayout = (e: LayoutChangeEvent) => {
    onLayout?.(e);
    setY(e.nativeEvent.layout.y);
  };
  const opacity =
    y == null
      ? 1
      : scrollY.interpolate({
          inputRange: [y - CARD_FADE_DISTANCE, y - CARD_FADE_DISTANCE / 2, y],
          outputRange: [1, 0.8, 0.4],
          extrapolate: 'clamp',
        });
  return (
    <Animated.View style={[style, { opacity }]} onLayout={handleLayout}>
      {children}
    </Animated.View>
  );
}

export function LogHomeScreen({ coffees, onSelectCoffee, onAddNew }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const scrollY = useRef(new Animated.Value(0)).current;
  const [ctaHeight, setCtaHeight] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coffees;
    return coffees.filter(
      (c) =>
        c.bean.toLowerCase().includes(q) ||
        c.roaster.toLowerCase().includes(q) ||
        (c.origin?.toLowerCase().includes(q) ?? false),
    );
  }, [coffees, query]);

  // Fade the title + search pill out as the CTA scrolls up, ease-in-out: fully
  // gone by the time the title baseline reaches the top bar. Sampled across a
  // few stops because RN's interpolate is linear between stops.
  const titleBottom = Math.max(ctaHeight - CTA_PADDING_BOTTOM, 1);
  const ctaFadeOpacity = scrollY.interpolate({
    inputRange: Array.from(
      { length: CTA_FADE_STEPS + 1 },
      (_, i) => (titleBottom * i) / CTA_FADE_STEPS,
    ),
    outputRange: Array.from(
      { length: CTA_FADE_STEPS + 1 },
      (_, i) => 1 - easeInOut(i / CTA_FADE_STEPS),
    ),
    extrapolate: 'clamp',
  });

  // Stable cell renderer so cells aren't remounted each render; injects the
  // (ref-backed, stable) scrollY into every row's fade.
  const CellRendererComponent = useMemo(() => {
    const Cell = (p: CellRendererProps<Coffee>) => (
      <FadingCell {...p} scrollY={scrollY} />
    );
    Cell.displayName = 'LogCell';
    return Cell;
  }, [scrollY]);

  // The screen sits inside a SafeAreaView padded up by insets.bottom; the tab
  // bar lives outside that padding, so add TAB_BAR_HEIGHT back (netting out the
  // inset) plus breathing room so the last card clears the bottom chrome.
  const listBottomPad =
    Math.max(insets.bottom, 16) - insets.bottom + TAB_BAR_HEIGHT + 24;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onAddNew}
          style={({ pressed }) => [styles.addPill, pressed && styles.addPillPressed]}
          accessibilityRole="button"
          accessibilityLabel="Add a new coffee"
        >
          <Text style={styles.addPillText}>Add</Text>
        </Pressable>
      </View>

      <Animated.FlatList
        data={filtered}
        keyExtractor={(c: Coffee) => c.id}
        keyboardShouldPersistTaps="handled"
        style={styles.listFill}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        CellRendererComponent={CellRendererComponent}
        ListHeaderComponent={
          <Animated.View
            style={[styles.cta, { opacity: ctaFadeOpacity }]}
            onLayout={(e) => setCtaHeight(e.nativeEvent.layout.height)}
          >
            <Text style={styles.ctaTitle}>What are we brewing today?</Text>
            <View style={styles.searchShadow}>
              <View style={styles.searchBar}>
                <SearchIcon size={20} color={colors.greyDark} strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search your cupboard"
                  placeholderTextColor={colors.greyDark}
                  accessibilityLabel="Search your cupboard"
                  returnKeyType="search"
                />
                {query.length > 0 ? (
                  <Pressable
                    onPress={() => setQuery('')}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearGlyph}>×</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query.trim()
              ? 'No coffees match that search.'
              : 'Your cupboard is empty — tap Add to log your first bag.'}
          </Text>
        }
        renderItem={({ item }: { item: Coffee }) => (
          <BeanRow coffee={item} onPress={() => onSelectCoffee(item)} />
        )}
      />

      {/* Soft gradient that fades the list into the tab bar at the bottom. */}
      <BottomChromeScrim />
    </View>
  );
}

function BeanRow({ coffee, onPress }: { coffee: Coffee; onPress: () => void }) {
  const flag = coffee.origin ? ORIGIN_FLAGS[coffee.origin] ?? '' : '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Brew ${coffee.bean} from ${coffee.roaster}`}
    >
      <Card style={styles.beanCard}>
        <Bag coffee={coffee} width={60} height={60} beanNameOnly />
        <View style={styles.beanText}>
          <Text style={styles.beanName} numberOfLines={2}>
            {coffee.bean}
          </Text>
          <Text style={styles.roasterName} numberOfLines={1}>
            {coffee.roaster}
          </Text>
          {coffee.origin || coffee.roastLevel ? (
            <Text style={styles.origin} numberOfLines={1}>
              {coffee.origin ? `${flag ? `${flag} ` : ''}${coffee.origin}` : ''}
              {coffee.origin && coffee.roastLevel ? '  •  ' : ''}
              {coffee.roastLevel ?? ''}
            </Text>
          ) : null}
        </View>
        {coffee.date ? <Text style={styles.date}>{formatDate(coffee.date)}</Text> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    // Overlay the list (no fill) so cards stay visible flowing up behind the
    // Add button as they fade past the top edge.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 12,
  },
  cta: {
    paddingTop: CTA_PADDING_TOP,
    paddingBottom: CTA_PADDING_BOTTOM,
    alignItems: 'center',
    gap: 24,
  },
  ctaTitle: {
    // H3 — Avenir Heavy 21/800, line-height 1.4 (see design system).
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 21,
    color: colors.black,
    lineHeight: 29,
    letterSpacing: -0.5,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  addPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  addPillPressed: { opacity: 0.85 },
  addPillText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 15,
    color: colors.black,
  },
  listFill: { flex: 1 },
  list: { paddingHorizontal: 24, gap: 12 },
  beanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  beanText: { flex: 1, minWidth: 0, gap: 3 },
  beanName: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 20,
    color: colors.black,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  roasterName: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    lineHeight: 18,
  },
  origin: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 18,
  },
  date: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    alignSelf: 'center',
  },
  empty: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    textAlign: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  searchShadow: {
    alignSelf: 'center',
    width: '80%',
    borderRadius: 25,
    backgroundColor: surfaces.pillFill,
    ...surfaces.shadow,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    height: 50,
    borderRadius: 25,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: surfaces.pillHairline,
    backgroundColor: surfaces.pillFill,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    padding: 0,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  clearGlyph: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.greyDark,
  },
});
