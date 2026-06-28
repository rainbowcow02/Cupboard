import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '@shared/theme';

interface Props {
  /** The base recipe's value for this field, formatted for display. */
  previous?: string;
}

/**
 * "was 18 g" hint shown beneath a field when its value differs from the base
 * recipe being iterated on, so it's obvious what's being changed for this test.
 * Renders nothing when there's no previous value to compare against.
 */
export function FieldDiffHint({ previous }: Props) {
  const trimmed = previous?.trim();
  if (!trimmed) return null;
  return (
    <Text style={styles.hint} accessibilityLabel={`Previously ${trimmed}`}>
      was {trimmed}
    </Text>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 12,
    color: colors.burgundy,
    marginTop: 4,
  },
});
