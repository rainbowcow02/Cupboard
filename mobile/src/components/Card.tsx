import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type ViewStyle,
} from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
}

export function Card({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityRole,
  accessibilityLabel,
}: Props) {
  if (onPress != null || onLongPress != null) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.card, style]}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 34,
    overflow: 'hidden',
  },
});
