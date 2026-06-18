import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { Card } from '../Card';
import { TAB_BAR_HEIGHT } from '../TabBar';

export type RecipePath = 'repeat' | 'tweak' | 'new';

interface ChoiceCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  accessibilityLabel: string;
}

function ChoiceCard({ title, subtitle, onPress, accessibilityLabel }: ChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => pressed && styles.cardPressed}
    >
      <Card style={styles.choiceCard}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceSubtitle}>{subtitle}</Text>
      </Card>
    </Pressable>
  );
}

interface Props {
  coffee: Coffee;
  bottomInset: number;
  onChoose: (path: RecipePath) => void;
}

export function RecipeChoiceStep({ coffee, bottomInset, onChoose }: Props) {
  const scrollBottomPad = Math.max(bottomInset, 16) + TAB_BAR_HEIGHT + 24;
  const brewCount = coffee.brews.length;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}>
      <Text style={styles.prompt}>
        You’ve logged {brewCount} recipe{brewCount === 1 ? '' : 's'} for this bean. How do you want to brew today?
      </Text>

      <View style={styles.choices}>
        <ChoiceCard
          title="Same recipe again"
          subtitle="Pick a past brew and log today's cup without changing the recipe."
          onPress={() => onChoose('repeat')}
          accessibilityLabel="Log with the same recipe again"
        />
        <ChoiceCard
          title="Tweak a recipe"
          subtitle="Start from a brew you've used before and adjust grind, pours, or temperature."
          onPress={() => onChoose('tweak')}
          accessibilityLabel="Tweak an existing recipe"
        />
        <ChoiceCard
          title="New recipe"
          subtitle="Build a fresh pour structure, ratio, and temperature from scratch."
          onPress={() => onChoose('new')}
          accessibilityLabel="Start a new recipe"
        />
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
    marginBottom: 20,
  },
  choices: { gap: 12 },
  choiceCard: { padding: 18 },
  cardPressed: { opacity: 0.92 },
  choiceTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.black,
    lineHeight: 26,
    marginBottom: 6,
  },
  choiceSubtitle: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    lineHeight: 20,
  },
});
