import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { surfaces } from '@shared/theme';
import { BackButton } from './BackButton';

interface Props {
  onPress: () => void;
  /** Scroll offset driving the frosted circle fade-in. */
  scrollY: Animated.Value;
  /** Scroll offset (px) where the circle starts fading in. */
  fadeStart?: number;
  /** Scroll offset (px) where the circle reaches full opacity. */
  fadeEnd?: number;
  /** Positioning applied to the 44×44 hit area (e.g. absolute placement). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Back chevron that fades a frosted-glass circle in behind itself once the user
 * scrolls past the page title. The circle carries the same white fill + shadow as
 * the page's pill buttons, and the chevron is nudged left so it reads optically
 * centered inside the circle. Shared by Set recipe and the bean detail page.
 */
export function GlassBackButton({ onPress, scrollY, fadeStart = 0, fadeEnd = 32, style }: Props) {
  const glassOpacity = scrollY.interpolate({
    inputRange: [fadeStart, fadeEnd],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.hitArea, style]}>
      <Animated.View style={[styles.glass, { opacity: glassOpacity }]} pointerEvents="none">
        <View style={styles.glassFill}>
          <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
        </View>
      </Animated.View>
      <BackButton onPress={onPress} style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  glassFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: surfaces.pillHairline,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  // Nudge the back chevron left so it sits optically centered in the glass circle.
  icon: { transform: [{ translateX: -1.5 }] },
});
