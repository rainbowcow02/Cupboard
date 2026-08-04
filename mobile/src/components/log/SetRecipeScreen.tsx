import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors, fonts, surfaces } from '@shared/theme';
import { KeyboardAwareUpdateContext } from '../../lib/keyboardAwareUpdate';
import { Chevron } from '../Chevron';
import { GlassBackButton } from '../GlassBackButton';
import { HeaderPillButton } from '../HeaderPillButton';
import { BrewCard } from '../BrewCard';
import { EmbeddedRecipeForm } from './EmbeddedRecipeForm';
import { RecipeBeanHeader } from './RecipeBeanHeader';

/** The HOC attaches `update()` at runtime but the library's .d.ts omits it. */
type KeyboardAwareFlatListHandle = InstanceType<typeof KeyboardAwareFlatList> & {
  update: () => void;
};

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
  // Presented as a modal that covers the tab bar, so only the safe-area bottom is needed.
  const listBottomPad = Math.max(insets.bottom, 16) + 48;

  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<KeyboardAwareFlatListHandle>(null);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <GlassBackButton onPress={onBack} scrollY={scrollY} size={40} />
        {hasBrews ? (
          <HeaderPillButton
            label="New"
            onPress={onNew}
            accessibilityLabel="Start a new recipe"
          />
        ) : null}
      </View>

      {/* KeyboardAwareFlatList (not Animated.FlatList) so the blank recipe form
          rendered via ListEmptyComponent gets lifted above the keyboard, same as
          LogFormScaffold. It forks onScroll internally rather than wrapping a
          native-animated component, so the back-button fade runs on the JS
          driver here too. */}
      <KeyboardAwareFlatList
        ref={listRef}
        data={brews}
        keyExtractor={(brew: Brew) => String(brew.id)}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        enableOnAndroid
        extraHeight={32}
        enableResetScrollToCoords={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
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
            // Instant on the picker so returning here from the edit screen has no animation.
            animateDescription={false}
          />
        }
        ListEmptyComponent={
          // Lets a growing multiline field (e.g. Tasting/Brew notes) re-trigger
          // the scroll-into-view as it gains lines, not just on initial focus.
          <KeyboardAwareUpdateContext.Provider value={() => listRef.current?.update()}>
            <EmbeddedRecipeForm coffee={coffee} onSaved={onSaved} />
          </KeyboardAwareUpdateContext.Provider>
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
    // 16px on both edges so the back button and New pill mirror the coffee-detail header.
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
