import { StyleSheet, View } from 'react-native';
import { colors } from '@shared/theme';

interface Props {
  children: React.ReactNode;
}

/**
 * Full-screen opaque sheet stacked over the page that opened it — the coffee
 * detail page's edit-bean, new-recipe and edit-brew screens. Covers the content
 * beneath it so the screen underneath stays mounted (and scrolled where it was)
 * while the sheet is up.
 */
export function SheetOverlay({ children }: Props) {
  return <View style={styles.sheet}>{children}</View>;
}

const styles = StyleSheet.create({
  sheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pearl,
    zIndex: 20,
  },
});
