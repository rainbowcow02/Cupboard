import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brew } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { brewPickerSubtitle, brewSummaryLine } from '../../lib/brewSummary';
import { Card } from '../Card';
import { CupRating } from '../CupRating';
import { TAB_BAR_HEIGHT } from '../TabBar';

interface Props {
  brews: Brew[];
  bottomInset: number;
  onSelect: (brew: Brew) => void;
}

export function RecipePickerStep({ brews, bottomInset, onSelect }: Props) {
  const scrollBottomPad = Math.max(bottomInset, 16) + TAB_BAR_HEIGHT + 24;
  const sorted = [...brews].sort((a, b) => {
    const aTime = a.date ? Date.parse(a.date) : 0;
    const bTime = b.date ? Date.parse(b.date) : 0;
    return bTime - aTime;
  });

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}>
      <Text style={styles.prompt}>Choose the recipe you want to use as your starting point.</Text>
      <View style={styles.list}>
        {sorted.map((brew) => (
          <Pressable
            key={String(brew.id)}
            onPress={() => onSelect(brew)}
            accessibilityRole="button"
            accessibilityLabel={`Use recipe: ${brewSummaryLine(brew)}`}
          >
            <Card style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle} numberOfLines={2}>{brewSummaryLine(brew)}</Text>
                <CupRating rating={brew.rating} />
              </View>
              <Text style={styles.recipeSubtitle} numberOfLines={2}>{brewPickerSubtitle(brew)}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 4 },
  prompt: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
    color: colors.greyDark,
    lineHeight: 21,
    marginBottom: 16,
  },
  list: { gap: 12 },
  recipeCard: { padding: 16 },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  recipeTitle: {
    flex: 1,
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 18,
    color: colors.black,
    lineHeight: 22,
  },
  recipeSubtitle: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 18,
  },
});
