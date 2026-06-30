import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts } from '@shared/theme';
import { Card } from './Card';

interface Props {
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
}

/** Serif-titled option card used on the landing and recipe-choice screens. */
export function ChoiceCard({
  title,
  subtitle,
  onPress,
  disabled,
  accessibilityLabel,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={StyleSheet.flatten([styles.card, disabled && styles.disabled, style])}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18 },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.55 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 21,
    color: colors.black,
    lineHeight: 27,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    lineHeight: 20,
  },
});
