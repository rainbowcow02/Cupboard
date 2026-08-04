import { View, type ViewStyle } from 'react-native';
import { colors } from '@shared/theme';

type HorizontalProps = {
  orientation?: 'horizontal';
  color?: string;
  thickness?: number;
  opacity?: number;
};

type VerticalProps = {
  orientation: 'vertical';
  color?: string;
  thickness?: number;
  /** Fixed cross-axis length — required since a vertical divider can't stretch to fill its row. */
  length: number;
  opacity?: number;
};

type Props = HorizontalProps | VerticalProps;

export function Divider(props: Props) {
  const { color = colors.greyLight, thickness = 1, opacity = 0.6 } = props;
  const size: ViewStyle =
    props.orientation === 'vertical'
      ? { width: thickness, height: props.length }
      : { height: thickness };

  return (
    <View
      style={[{ backgroundColor: color, opacity }, size]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
