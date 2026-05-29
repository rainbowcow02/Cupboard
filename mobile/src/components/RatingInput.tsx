import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { colors } from '@shared/theme';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function RatingInput({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n === value ? 0 : n)} style={styles.star} hitSlop={6}>
          <Svg width={22} height={22} viewBox="0 0 9 9">
            <Polygon
              points="4.5,0.5 5.6,3.2 8.5,3.4 6.4,5.3 7.1,8.1 4.5,6.6 1.9,8.1 2.6,5.3 0.5,3.4 3.4,3.2"
              fill={n <= value ? colors.moss : 'none'}
              stroke={n <= value ? colors.moss : colors.greyLight}
              strokeWidth={0.75}
            />
          </Svg>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44 },
  star: { padding: 4 },
});
