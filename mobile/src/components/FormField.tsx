import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '@shared/theme';

interface Props {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FormField({ label, children, style }: Props) {
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
