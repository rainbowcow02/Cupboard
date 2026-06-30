import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

interface Props {
  /** Row position; later rows reveal slightly later for a cascade effect. */
  index: number;
  children: React.ReactNode;
}

/** Per-row stagger applied to each revealing field (ms). */
const CASCADE_STEP = 35;
const CASCADE_DURATION = 300;

/**
 * Wraps a form row so it fades + rises into place when the form mounts, each row
 * delayed a beat after the one above it — so the recipe form assembles itself
 * rather than appearing all at once. Respects the OS "Reduce Motion" setting.
 */
export function CascadeItem({ index, children }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * CASCADE_STEP)
        .duration(CASCADE_DURATION)
        .reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
}
