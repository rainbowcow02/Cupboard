import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, links } from '@shared/theme';

interface Props {
  /** Visible text, already including the leading "+" (e.g. "+ Add pour"). */
  label: string;
  onPress: () => void;
  /** Defaults to the label; override when the label alone reads ambiguously. */
  accessibilityLabel?: string;
}

/**
 * The one treatment for inline "+ Add …" text actions — section headers and
 * in-form row adders alike. Styling is the `links.small` design-system token
 * from `shared/theme.ts` in burgundy; don't restate the values here.
 */
export function AddLink({ label, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={links.hitSlop}
      style={({ pressed }) => [styles.addLink, pressed && styles.addLinkPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.addLinkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addLink: { paddingVertical: links.paddingVertical },
  addLinkPressed: { opacity: links.pressedOpacity },
  addLinkText: { ...links.small, color: colors.burgundy },
});
