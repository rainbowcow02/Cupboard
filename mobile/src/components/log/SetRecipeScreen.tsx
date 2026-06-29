import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors, fonts, surfaces } from '@shared/theme';
import { GlassBackButton } from '../GlassBackButton';
import { BeanCard } from '../BeanCard';
import { BrewCard } from '../BrewCard';
import { TAB_BAR_HEIGHT } from '../TabBar';

interface Props {
  coffee: Coffee;
  onBack: () => void;
  /** Duplicate the chosen brew into a fresh, editable recipe. */
  onPickRecipe: (base: Brew) => void;
  /** Start from a blank recipe. */
  onNew: () => void;
  /** Open the full bean detail page for the chosen bean. */
  onOpenBean: () => void;
}

/** Right-pointing chevron used on the bean header and duplicate tabs. */
function Chevron({ color }: { color: string }) {
  return (
    <Svg width={6} height={10} viewBox="0 0 6 10" fill="none">
      <Path
        d="M1 1L5 5L1 9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Recipe picker for a selected bean: a header showing the chosen bean, then the
 * bean's past brews as full BrewCards. Each card carries a green "Duplicate this
 * recipe" tab that seeds a new editable recipe. "New" (top-right) starts from a
 * blank form.
 */
export function SetRecipeScreen({ coffee, onBack, onPickRecipe, onNew, onOpenBean }: Props) {
  const insets = useSafeAreaInsets();
  const brews = coffee.brews;
  const listBottomPad = Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 48;

  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <GlassBackButton onPress={onBack} scrollY={scrollY} style={styles.backButton} />
        <Pressable
          onPress={onNew}
          style={({ pressed }) => [styles.newPill, pressed && styles.newPillPressed]}
          accessibilityRole="button"
          accessibilityLabel="Start a new recipe"
        >
          <Text style={styles.newPillText}>New</Text>
        </Pressable>
      </View>

      <Animated.FlatList
        data={brews}
        keyExtractor={(brew: Brew) => String(brew.id)}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.intro}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Set your recipe</Text>
                <Text style={styles.description}>
                  Iterate on an existing recipe or make a new one.
                </Text>
              </View>
              <BeanCard
                coffee={coffee}
                onPress={onOpenBean}
                accessibilityLabel={`View details for ${coffee.bean} from ${coffee.roaster}`}
                trailing={<Chevron color={colors.greyDark} />}
              />
            </View>

            <View style={styles.headerDivider} />
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No recipes yet for this bean — tap New to dial one in.
          </Text>
        }
        renderItem={({ item }: { item: Brew }) => (
          <View style={styles.recipeItem}>
            <Pressable
              onPress={() => onPickRecipe(item)}
              style={({ pressed }) => [styles.duplicateTab, pressed && styles.duplicateTabPressed]}
              accessibilityRole="button"
              accessibilityLabel="Use this recipe"
            >
              <Text style={styles.duplicateTabText}>Use this recipe</Text>
              <Chevron color="#ffffff" />
            </Pressable>
            <View style={styles.cardWrap}>
              <BrewCard brew={item} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { marginLeft: -14 },
  newPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: surfaces.pillRadius,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  newPillPressed: { opacity: 0.85 },
  newPillText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 15,
    color: colors.black,
  },
  list: { paddingHorizontal: 24, paddingTop: 64, gap: 24 },
  listHeader: { gap: 24 },
  intro: { gap: 16 },
  titleBlock: { gap: 4, marginTop: 8 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.black,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
    color: colors.greyDark,
    lineHeight: 21,
  },
  headerDivider: { height: 1, backgroundColor: colors.supremeBeige, opacity: 0.7 },
  recipeItem: {},
  duplicateTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.burgundy,
    borderTopLeftRadius: surfaces.cardRadius,
    borderTopRightRadius: surfaces.cardRadius,
    paddingTop: 12,
    paddingBottom: 48,
  },
  duplicateTabPressed: { opacity: 0.9 },
  duplicateTabText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
    color: '#ffffff',
  },
  cardWrap: { marginTop: -36, zIndex: 1 },
  empty: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    textAlign: 'center',
    paddingVertical: 32,
    lineHeight: 20,
  },
});
