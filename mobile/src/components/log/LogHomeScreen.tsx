import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, formatDate, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
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
 * an iteration; "Add" (subtle, top-right) starts a new bean. A floating search
 * pill sits over the tab bar and only raises the keyboard once tapped.
 */
// Vertical breathing room above the brewing CTA, and the gap before the list
// begins. Kept as constants so the collapse threshold can be derived from them.
const CTA_PADDING_TOP = 100;
const CTA_PADDING_BOTTOM = 16;

export function LogHomeScreen({ coffees, onSelectCoffee, onAddNew }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const keyboardOffset = useKeyboardOffset();

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

  // Hand the title off to the collapsed header as the big CTA scrolls out of
  // view: fully collapsed by the time its baseline reaches the header.
  const titleBottom = Math.max(ctaHeight - CTA_PADDING_BOTTOM, 1);
  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [Math.max(titleBottom - 32, 0), titleBottom],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // The screen sits inside a SafeAreaView that already pads content up by
  // insets.bottom, so subtract it back out: the tab bar lives outside that
  // padding. Its pill top is at max(insets,16) + (TAB_BAR_HEIGHT - 16) from the
  // true screen bottom; +8 floats the search bar 8px above it.
  const searchClearance =
    Math.max(insets.bottom, 16) - insets.bottom + TAB_BAR_HEIGHT + 0;
  const listBottomPad = searchClearance + 60;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Animated.Text
          style={[styles.collapsedTitle, { opacity: collapsedTitleOpacity }]}
          numberOfLines={1}
        >
          What are we brewing today?
        </Animated.Text>
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
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        ListHeaderComponent={
          <View
            style={styles.cta}
            onLayout={(e) => setCtaHeight(e.nativeEvent.layout.height)}
          >
            <Text style={styles.ctaTitle}>What are we brewing today?</Text>
          </View>
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

      {/* Layered above the list (fades cards) but below the search dock. */}
      <BottomChromeScrim />

      <Animated.View
        style={[
          styles.searchDock,
          { bottom: searchClearance, transform: [{ translateY: keyboardOffset }] },
        ]}
      >
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
      </Animated.View>
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
          {coffee.origin ? (
            <Text style={styles.origin} numberOfLines={1}>
              {flag ? `${flag} ` : ''}
              {coffee.origin}
            </Text>
          ) : null}
        </View>
        {coffee.date ? <Text style={styles.date}>{formatDate(coffee.date)}</Text> : null}
      </Card>
    </Pressable>
  );
}

/** Lifts the docked search bar above the soft keyboard when it opens. */
function useKeyboardOffset(): Animated.Value {
  const offset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvt, (e) => {
      Animated.timing(offset, {
        toValue: -e.endCoordinates.height,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
    const onHide = Keyboard.addListener(hideEvt, () => {
      Animated.timing(offset, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [offset]);
  return offset;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.pearl,
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 12,
  },
  collapsedTitle: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.black,
    lineHeight: 23,
    letterSpacing: -0.17,
  },
  cta: {
    paddingTop: CTA_PADDING_TOP,
    paddingBottom: CTA_PADDING_BOTTOM,
  },
  ctaTitle: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 21,
    color: colors.black,
    lineHeight: 29,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  addPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  addPillPressed: { opacity: 0.85 },
  addPillText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 15,
    color: colors.black,
  },
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
  searchDock: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 60, // above BottomChromeScrim (zIndex 50) so the bar stays white
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    height: 50,
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
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
