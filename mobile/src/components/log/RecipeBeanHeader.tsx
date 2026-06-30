import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { BeanCard } from '../BeanCard';
import { Chevron } from '../Chevron';

interface Props {
  coffee: Coffee;
  /** Subheading under the "Set a recipe" title. */
  description: string;
  /** Open the full bean detail page for the chosen bean. */
  onOpenBean: () => void;
  /**
   * Float the description in on mount. On for the edit screen (forward "magic");
   * off on the picker so returning to it from the edit screen is instant.
   */
  animateDescription?: boolean;
}

/**
 * Shared "Set a recipe" header: the title / description block, the chosen bean's
 * BeanCard (tappable through to its detail page), and a divider. Used on both the
 * recipe picker and the edit-recipe screen so their headers stay identical.
 */
export function RecipeBeanHeader({
  coffee,
  description,
  onOpenBean,
  animateDescription = true,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.intro}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Set a recipe</Text>
          {/* Keyed so the line re-mounts (and floats up) whenever the contextual
              copy changes — e.g. picker → "new" / "use this recipe". The title and
              bean card stay static as the anchor. */}
          {animateDescription ? (
            <Animated.Text
              key={description}
              style={styles.description}
              entering={FadeInDown.duration(260).reduceMotion(ReduceMotion.System)}
            >
              {description}
            </Animated.Text>
          ) : (
            <Text style={styles.description}>{description}</Text>
          )}
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
  );
}

const styles = StyleSheet.create({
  header: { gap: 24 },
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
});
