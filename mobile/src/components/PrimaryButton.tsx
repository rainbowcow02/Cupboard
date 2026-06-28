import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, surfaces } from '@shared/theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Shown in place of label while an async action runs. */
  busyLabel?: string;
  busy?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/** Burgundy pill — the primary action on log/new-bean forms. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  busyLabel,
  busy,
  style,
  accessibilityLabel,
}: Props) {
  const isDisabled = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
    >
      <Text style={styles.label}>{busy ? busyLabel ?? label : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.burgundy,
    borderRadius: surfaces.pillRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#b9a99a' },
  label: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.pearl,
  },
});
