import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { surfaces } from '@shared/theme';

interface FloatingSurfacePillProps {
  children?: ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
}

export function FloatingSurfacePill({
  children,
  style,
  borderRadius = surfaces.pillRadius,
}: FloatingSurfacePillProps) {
  return (
    <View style={[styles.pill, { borderRadius }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: surfaces.pillFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: surfaces.pillHairline,
    overflow: 'hidden',
  },
});
