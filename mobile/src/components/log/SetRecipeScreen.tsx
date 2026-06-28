import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors, fonts, surfaces } from '@shared/theme';
import { BackButton } from '../BackButton';
import { BrewCard } from '../BrewCard';
import { TAB_BAR_HEIGHT } from '../TabBar';

interface Props {
  coffee: Coffee;
  onBack: () => void;
  /** Duplicate the chosen brew into a fresh, editable recipe. */
  onPickRecipe: (base: Brew) => void;
  /** Start from a blank recipe. */
  onNew: () => void;
}

/**
 * Recipe picker for a selected bean: the bean's past brews shown as full
 * BrewCards in a vertical list, each with a "Duplicate" affordance that seeds a
 * new editable recipe. "New" (top-right) starts from a blank form.
 */
export function SetRecipeScreen({ coffee, onBack, onPickRecipe, onNew }: Props) {
  const insets = useSafeAreaInsets();
  const brews = coffee.brews;
  const listBottomPad = Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 48;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton onPress={onBack} />
          <Pressable
            onPress={onNew}
            style={({ pressed }) => [styles.newPill, pressed && styles.newPillPressed]}
            accessibilityRole="button"
            accessibilityLabel="Start a new recipe"
          >
            <Text style={styles.newPillText}>New</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Set brew recipe</Text>
        <Text style={styles.description}>
          Pick a recipe to start from or make a new one.
        </Text>
      </View>

      <FlatList
        data={brews}
        keyExtractor={(brew) => String(brew.id)}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No recipes yet for this bean — tap New to dial one in.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.recipeItem}>
            <BrewCard brew={item} />
            <Pressable
              onPress={() => onPickRecipe(item)}
              style={({ pressed }) => [
                styles.duplicateButton,
                pressed && styles.duplicateButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Duplicate this recipe"
            >
              <Text style={styles.duplicateText}>Duplicate this recipe</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
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
  list: { paddingHorizontal: 24, paddingTop: 4, gap: 16 },
  recipeItem: { gap: 10 },
  duplicateButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: surfaces.pillRadius,
    borderWidth: 1.5,
    borderColor: colors.burgundy,
  },
  duplicateButtonPressed: { backgroundColor: 'rgba(93,5,5,0.06)' },
  duplicateText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.burgundy,
  },
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
