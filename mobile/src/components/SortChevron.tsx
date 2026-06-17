import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface SortChevronProps {
  flipped: boolean;
  color: string;
  style?: StyleProp<ViewStyle>;
}

export function SortChevron({ flipped, color, style }: SortChevronProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(flipped ? '180deg' : '0deg', { duration: 150 }) }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Svg width={9} height={6} viewBox="0 0 9 6" fill="none">
        <Path d="M0 0L9 0L4.5 6Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}
