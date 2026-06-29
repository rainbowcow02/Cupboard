import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '@shared/theme';

interface Props {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Lay the label out left, the input right, as a single settings-style row. */
  horizontal?: boolean;
}

export function FormField({ label, children, style, horizontal }: Props) {
  if (horizontal) {
    return (
      <View style={[styles.rowContainer, style]}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowInput}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export const fieldInputStyle = {
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 14,
  borderWidth: 0.5,
  borderColor: 'rgba(0,0,0,0.14)',
  backgroundColor: 'rgba(255,255,255,0.7)',
  fontFamily: fonts.sans,
  fontSize: 15,
  fontWeight: '500' as const,
  color: '#000',
} as const;

const styles = StyleSheet.create({
  container: { flex: 1, minWidth: 0 },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 46,
  },
  rowLabel: {
    width: 92,
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 15,
    color: colors.black,
  },
  rowInput: { flex: 1, minWidth: 0 },
  label: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 11,
    color: colors.greyDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
});
