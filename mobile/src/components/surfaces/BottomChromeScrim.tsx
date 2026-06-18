import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, surfaces } from '@shared/theme';

export function BottomChromeScrim() {
  return (
    <View style={styles.scrim} pointerEvents="none">
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
    bottom: 0,
    left: 0,
    right: 0,
    height: surfaces.scrimHeight,
    zIndex: 50,
  },
});
