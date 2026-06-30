import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors, fonts, surfaces } from '@shared/theme';
import { Chevron } from '../Chevron';
import { GlassBackButton } from '../GlassBackButton';
import { BrewCard } from '../BrewCard';
import { TAB_BAR_HEIGHT } from '../TabBar';
import { EmbeddedRecipeForm } from './EmbeddedRecipeForm';
import { RecipeBeanHeader } from './RecipeBeanHeader';

interface Props {
  coffee: Coffee;
  onBack: () => void;
  /** Duplicate the chosen brew into a fresh, editable recipe. */
  onPickRecipe: (base: Brew) => void;
  /** Start from a blank recipe. */
  onNew: () => void;
  /** Open the full bean detail page for the chosen bean. */
  onOpenBean: () => void;
  /** Save the inline recipe shown when the bean has no brews yet. */
  onSaved: () => Promise<void>;
}

/**
 * Recipe picker for a selected bean: a header showing the chosen bean, then the
 * bean's past brews as full BrewCards. Each card carries a green "Duplicate this
 * recipe" tab that seeds a new editable recipe. "New" (top-right) starts from a
 * blank form. When the bean has no brews yet, the blank recipe form is embedded
 * inline below the divider instead.
 */
export function SetRecipeScreen({
  coffee,
  onBack,
  onPickRecipe,
  onNew,
  onOpenBean,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const brews = coffee.brews;
  const hasBrews = brews.length > 0;
  const listBottomPad = Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 48;

  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <GlassBackButton onPress={onBack} scrollY={scrollY} style={styles.backButton} />
        {hasBrews ? (
          <Pressable
            onPress={onNew}
            style={({ pressed }) => [styles.newPill, pressed && styles.newPillPressed]}
            accessibilityRole="button"
            accessibilityLabel="Start a new recipe"
          >
            <Text style={styles.newPillText}>New</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.FlatList
        data={brews}
        keyExtractor={(brew: Brew) => String(brew.id)}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        ListHeaderComponent={
          <RecipeBeanHeader
            coffee={coffee}
            description={
              hasBrews
                ? 'Use an existing recipe or make a new one.'
                : 'No recipes yet—dial in your first one.'
            }
            onOpenBean={onOpenBean}
          />
        }
        ListEmptyComponent={
          <EmbeddedRecipeForm coffee={coffee} onSaved={onSaved} />
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
});
