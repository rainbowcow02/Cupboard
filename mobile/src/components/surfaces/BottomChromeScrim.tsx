import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, surfaces } from '@shared/theme';

export function BottomChromeScrim() {
  const insets = useSafeAreaInsets();
  // Anchor to the very bottom of the device: the host SafeAreaView pads content
  // up by the bottom inset, so reach back down through it with a negative bottom
  // (and add that height) instead of floating above the home-indicator gap.
  return (
    <View
      style={[styles.scrim, { bottom: -insets.bottom, height: surfaces.scrimHeight + insets.bottom }]}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="bottomChromeScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.pearl} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.chardonnay} stopOpacity={0.6} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bottomChromeScrim)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
  },
});
