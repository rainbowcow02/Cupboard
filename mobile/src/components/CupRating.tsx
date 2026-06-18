import { StyleSheet, Text, View } from 'react-native';
import { cupRatingScale, fonts, surfaces, type CupRatingValue } from '@shared/theme';

interface Props {
  rating?: number;
}

function clampRating(rating: number): CupRatingValue {
  const rounded = Math.round(rating);
  return Math.min(5, Math.max(1, rounded)) as CupRatingValue;
}

/**
 * Tinted pill showing a coffee rating as ☕️ cups (1–5).
 * Background color is driven by the shared `cupRatingScale` token so brew cards,
 * recipe cards, and any other rating display stay visually consistent.
 */
export function CupRating({ rating }: Props) {
  if (!rating || rating <= 0) return null;
  const value = clampRating(rating);
  return (
    <View
      style={[styles.pill, { backgroundColor: cupRatingScale[value] }]}
      accessibilityRole="image"
      accessibilityLabel={`${value} out of 5 cups`}
    >
      <Text style={styles.cups}>{'☕️'.repeat(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: surfaces.pillRadius,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cups: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: -0.5,
    lineHeight: 20
    ,
  },
});
