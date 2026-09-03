import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, links } from '@shared/theme';

interface Props {
  /** Visible text, already including the leading "+" (e.g. "+ Add pour"). */
  label: string;
  onPress: () => void;
  size?: 'small' | 'large';
  /** Defaults to the label; override when the label alone reads ambiguously. */
  accessibilityLabel?: string;
}

/**
 * Shared treatment for inline "+ Add …" text actions. Styling comes from the
 * matching `links` design-system token in `shared/theme.ts`.
 */
export function AddLink({ label, onPress, size = 'small', accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={links.hitSlop}
      style={({ pressed }) => [styles.addLink, pressed && styles.addLinkPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.addLinkText, size === 'large' && styles.addLinkTextLarge]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addLink: { paddingVertical: links.paddingVertical },
  addLinkPressed: { opacity: links.pressedOpacity },
  addLinkText: { ...links.small, color: colors.burgundy },
  addLinkTextLarge: { ...links.large },
});
