import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { type ReactNode } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { floatingSurfaceStyles } from './floatingSurfaceStyles';

interface DetachedSheetContentClipProps {
  children: ReactNode;
}

export function DetachedSheetContentClip({ children }: DetachedSheetContentClipProps) {
  const { animatedPosition, animatedLayoutState } = useBottomSheetInternal();
  const clipStyle = useAnimatedStyle(() => {
    const { containerHeight, handleHeight } = animatedLayoutState.get();
    const visible = containerHeight - animatedPosition.get() - Math.max(handleHeight, 0);
    return { height: visible > 0 ? visible : 0 };
  });
  return (
    <Animated.View style={[floatingSurfaceStyles.cardClip, clipStyle]}>
      {children}
    </Animated.View>
  );
}
