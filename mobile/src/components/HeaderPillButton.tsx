import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, surfaces } from '@shared/theme';

interface Props {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Extra positioning (e.g. absolute placement) merged onto the pill. */
  style?: StyleProp<ViewStyle>;
}

/**
 * White 40px header pill sitting opposite a `GlassBackButton` — the top-right
 * action on the coffee-detail, set-recipe, and log-form headers. Solid pill fill
 * with a hairline border and soft shadow, 14px horizontal padding.
 */
export function HeaderPillButton({ label, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pillPressed, style]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: surfaces.pillRadius,
    backgroundColor: surfaces.pillFill,
    borderWidth: 1,
    borderColor: surfaces.pillHairline,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  pillPressed: { opacity: 0.7 },
  pillText: { fontFamily: fonts.sans, fontWeight: '700', fontSize: 15, color: colors.black },
});
