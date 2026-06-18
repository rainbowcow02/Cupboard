import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@shared/theme';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function SearchIcon({ size = 28, color = colors.burgundy, strokeWidth = 2.2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={11} cy={11} r={7}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M16.5 16.5L21 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
