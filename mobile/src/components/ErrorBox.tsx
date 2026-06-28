import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '@shared/theme';

interface Props {
  message: string;
  style?: ViewStyle;
}

/** Soft blossom-pink error panel used across the log forms. */
export function ErrorBox({ message, style }: Props) {
  return (
    <View style={[styles.box, style]} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(252,153,155,0.22)',
    borderRadius: 12,
    padding: 12,
  },
  text: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.burgundy,
  },
});
