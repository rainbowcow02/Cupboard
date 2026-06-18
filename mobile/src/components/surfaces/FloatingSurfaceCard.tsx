import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { floatingSurfaceStyles } from './floatingSurfaceStyles';

interface FloatingSurfaceCardProps {
  children: ReactNode;
}

export function FloatingSurfaceCard({ children }: FloatingSurfaceCardProps) {
  return (
    <View style={floatingSurfaceStyles.cardShell}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    position: 'relative',
  },
});
