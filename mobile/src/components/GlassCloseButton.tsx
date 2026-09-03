import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { CloseButton } from './CloseButton';
import { GlassCircle } from './surfaces/GlassCircle';

interface Props {
  onPress: () => void;
  /** Scroll offset driving the frosted circle fade-in. */
  scrollY: Animated.Value;
  /** Scroll offset (px) where the circle starts fading in. */
  fadeStart?: number;
  /** Scroll offset (px) where the circle reaches full opacity. */
  fadeEnd?: number;
  /** Diameter of the circular hit area / frosted circle. Icon scales with it. */
  size?: number;
  /** Positioning applied to the hit area (e.g. absolute placement). */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Dismiss X in the same frosted-glass circle as `GlassBackButton` — used where a
 * sheet is cancelled rather than navigated back from. The X is sized off the same
 * half-the-circle rule as the back chevron so the two icons read identically.
 */
export function GlassCloseButton({
  onPress,
  scrollY,
  fadeStart = 0,
  fadeEnd = 32,
  size = 44,
  style,
  accessibilityLabel,
}: Props) {
  const iconSize = Math.round(size / 2) - 2;

  return (
    <View style={[styles.hitArea, { width: size, height: size }, style]}>
      <GlassCircle size={size} scrollY={scrollY} fadeStart={fadeStart} fadeEnd={fadeEnd} />
      <CloseButton onPress={onPress} size={iconSize} accessibilityLabel={accessibilityLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
