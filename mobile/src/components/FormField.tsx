import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors, fonts } from '@shared/theme';

interface Props {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Lay the label out left, the input right, as a single settings-style row. */
  horizontal?: boolean;
  /** Override the (vertical-layout) label's text style, e.g. to match the row-label font. */
  labelStyle?: StyleProp<TextStyle>;
}

export function FormField({ label, children, style, horizontal, labelStyle }: Props) {
  if (horizontal) {
    return (
      <View style={[styles.rowContainer, style]}>
        <View style={styles.rowLabelWrap}>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <View style={styles.rowInput}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
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
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 46,
  },
  // Matches the field's min height and centers the label within it, so a
  // diff hint rendered below the field doesn't drag the label down with it.
  rowLabelWrap: { width: 92, minHeight: 46, justifyContent: 'center' },
  rowLabel: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 15,
    color: colors.black,
  },
  rowInput: { flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center' },
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
