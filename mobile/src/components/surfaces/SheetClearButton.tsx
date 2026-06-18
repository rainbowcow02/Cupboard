import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { floatingSurfaceStyles } from './floatingSurfaceStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SheetClearButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  /** When true the button is visible; when false it fades/scales out (filter sheet). */
  showClear?: boolean;
  animated?: boolean;
}

export function SheetClearButton({
  onPress,
  accessibilityLabel,
  showClear = true,
  animated = false,
}: SheetClearButtonProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: showClear ? 1 : 0,
    transform: [{ scale: showClear ? 1 : 0.5 }],
  }));

  const buttonProps = {
    onPress,
    disabled: !showClear,
    accessibilityRole: 'button' as const,
    accessibilityLabel,
    style: [floatingSurfaceStyles.clearButton, animated ? animatedStyle : undefined],
  };

  if (animated) {
    return (
      <AnimatedPressable {...buttonProps}>
        <Text style={floatingSurfaceStyles.clearButtonText}>✕</Text>
      </AnimatedPressable>
    );
  }

  if (!showClear) return null;

  return (
    <Pressable {...buttonProps}>
      <Text style={floatingSurfaceStyles.clearButtonText}>✕</Text>
    </Pressable>
  );
}
