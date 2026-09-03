import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@shared/theme';

interface Props {
  onPress: () => void;
  color?: string;
  /** Rendered box. Drawn in the same 22-unit grid as `BackButton`, so at a shared
   *  size the two icons carry an identical stroke weight. */
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Dismiss X for sheets that are cancelled rather than navigated back from — the
 * iOS convention. Same stroke weight and ink as `BackButton` so the two icons
 * read as the same set when they appear in the same header slot.
 */
export function CloseButton({
  onPress,
  color = colors.black,
  size = 22,
  style,
  accessibilityLabel = 'Close',
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={style}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
        <Path
          d="M3.5 3.5L18.5 18.5M18.5 3.5L3.5 18.5"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}
