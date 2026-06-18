import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { floatingSurfaceStyles } from './floatingSurfaceStyles';

export function DetachedSheetBackground() {
  const { animatedPosition, animatedLayoutState } = useBottomSheetInternal();
  const cardStyle = useAnimatedStyle(() => {
    const visible = animatedLayoutState.get().containerHeight - animatedPosition.get();
    return { height: visible > 0 ? visible : 0 };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[floatingSurfaceStyles.cardShell, styles.background, cardStyle]}
    />
  );
}

const styles = {
  background: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
  },
};
