import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@shared/theme';

interface Props {
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function BackButton({ onPress, color = colors.black, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={style}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Svg width={14} height={22} viewBox="0 0 14 22" fill="none">
        <Path
          d="M12 2L3 11L12 20"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}
