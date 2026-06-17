import { BlurView } from 'expo-blur';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: Props) {
  return (
    <View style={[styles.outer, style]}>
      <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.whiteFill} />
      <View style={styles.tint} />
      <View style={styles.sheen} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 34,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 8,
  },
  whiteFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,245,245,0.6)',
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.09)',
    transform: [{ skewX: '-12deg' }, { scaleX: 1.4 }],
  },
  content: {
    position: 'relative',
  },
});
