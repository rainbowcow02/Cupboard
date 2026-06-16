import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@shared/theme';

interface FilterCheckboxProps {
  checked: boolean;
}

export function FilterCheckbox({ checked }: FilterCheckboxProps) {
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, { duration: 150 });
  }, [checked, progress]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', colors.blossomPink]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.supremeBeige, colors.blossomPink]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.4 + progress.value * 0.6 }],
  }));

  return (
    <Animated.View style={[styles.box, boxStyle]}>
      <Animated.View style={checkStyle}>
        <Svg width={12} height={9} viewBox="0 0 12 9" fill="none">
          <Path d="M1 4.5L4.5 8L11 1" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
