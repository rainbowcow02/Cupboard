import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '@shared/theme';

interface Props {
  /** The base recipe's value for this field, formatted for display. */
  previous?: string;
}

/** A beat after the value changes, then the hint fades + rises into place. */
const REVEAL_DELAY = 240;
const REVEAL_DURATION = 260;

/**
 * "was 18 g" hint shown beneath a field when its value differs from the base
 * recipe being iterated on, so it's obvious what's being changed for this test.
 * Renders nothing when there's no previous value to compare against.
 */
export function FieldDiffHint({ previous }: Props) {
  const trimmed = previous?.trim();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (trimmed) {
      progress.value = 0;
      progress.value = withDelay(
        REVEAL_DELAY,
        withTiming(1, { duration: REVEAL_DURATION, easing: Easing.out(Easing.quad) }),
      );
    } else {
      progress.value = 0;
    }
  }, [trimmed, progress]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 4 }],
  }));

  if (!trimmed) return null;

  return (
    <Animated.View style={[styles.pill, revealStyle]}>
      <Text style={styles.hint} accessibilityLabel={`Previously ${trimmed}`}>
        was {trimmed}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(252,153,155,0.3)',
  },
  hint: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 12,
    color: colors.burgundy,
  },
});
