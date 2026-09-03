import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BackButton } from './BackButton';
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
}

/**
 * Back chevron that fades a frosted-glass circle in behind itself once the user
 * scrolls past the page title. The circle carries the same white fill + shadow as
 * the page's pill buttons, and the chevron is nudged left so it reads optically
 * centered inside the circle. Shared by Set recipe and the bean detail page.
 */
export function GlassBackButton({ onPress, scrollY, fadeStart = 0, fadeEnd = 32, size = 44, style }: Props) {
  // Chevron scales with the circle, keeping its original 14×22 proportions,
  // sitting 2px in from half-height so it reads a touch smaller in the circle.
  const iconHeight = Math.round(size / 2) - 2;
  const iconWidth = Math.round((iconHeight * 14) / 22);

  return (
    <View style={[styles.hitArea, { width: size, height: size }, style]}>
      <GlassCircle size={size} scrollY={scrollY} fadeStart={fadeStart} fadeEnd={fadeEnd} />
      <BackButton onPress={onPress} width={iconWidth} height={iconHeight} style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Nudge the back chevron left so it sits optically centered in the glass circle.
  icon: { transform: [{ translateX: -1.5 }] },
});
