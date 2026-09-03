import { Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { surfaces } from '@shared/theme';

interface Props {
  /** Diameter of the circle — matched to the button's hit area. */
  size: number;
  /** Scroll offset driving the fade-in. */
  scrollY: Animated.Value;
  /** Scroll offset (px) where the circle starts fading in. */
  fadeStart: number;
  /** Scroll offset (px) where the circle reaches full opacity. */
  fadeEnd: number;
}

/**
 * The frosted circle that sits behind a floating header icon button, fading in as
 * the page scrolls under it. Carries the same white fill, hairline and soft shadow
 * as the page's pill buttons, so the back and close affordances read as one family.
 */
export function GlassCircle({ size, scrollY, fadeStart, fadeEnd }: Props) {
  const opacity = scrollY.interpolate({
    inputRange: [fadeStart, fadeEnd],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const radius = size / 2;

  return (
    <Animated.View style={[styles.glass, { borderRadius: radius, opacity }]} pointerEvents="none">
      <Animated.View style={[styles.glassFill, { borderRadius: radius }]}>
        <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  glassFill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: surfaces.pillHairline,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
});
