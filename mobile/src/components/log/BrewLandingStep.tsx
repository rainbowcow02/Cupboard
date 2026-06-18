import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@shared/theme';
import { Card } from '../Card';
import { TAB_BAR_HEIGHT } from '../TabBar';

interface OptionProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

function Option({ title, subtitle, onPress, disabled, accessibilityLabel }: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => pressed && styles.optionPressed}
    >
      <Card style={StyleSheet.flatten([styles.optionCard, disabled && styles.optionDisabled])}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </Card>
    </Pressable>
  );
}

interface Props {
  coffeeCount: number;
  onSelectExisting: () => void;
  onAddNew: () => void;
}

export function BrewLandingStep({ coffeeCount, onSelectExisting, onAddNew }: Props) {
  const hasCoffees = coffeeCount > 0;

  return (
    <View style={styles.step}>
      <Text style={styles.heroText}>What are we brewing?</Text>

      <View style={styles.options}>
        <Option
          title="Choose a coffee"
          subtitle={
            hasCoffees
              ? `Pick from the ${coffeeCount} bag${coffeeCount === 1 ? '' : 's'} in your cupboard`
              : 'Your cupboard is empty — add one to get started'
          }
          onPress={onSelectExisting}
          disabled={!hasCoffees}
          accessibilityLabel="Choose a coffee from your cupboard"
        />
        <Option
          title="Add a new coffee"
          subtitle="Log a bag you haven’t brewed yet"
          onPress={onAddNew}
          accessibilityLabel="Add a new coffee"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  step: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: TAB_BAR_HEIGHT,
  },
  heroText: {
    fontFamily: fonts.serif,
    fontSize: 34,
    color: colors.black,
    lineHeight: 40,
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 24,
  },
  options: { gap: 12 },
  optionCard: { padding: 20 },
  optionPressed: { opacity: 0.92 },
  optionDisabled: { opacity: 0.55 },
  optionTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.black,
    lineHeight: 28,
    marginBottom: 6,
  },
  optionSubtitle: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    lineHeight: 20,
  },
});
