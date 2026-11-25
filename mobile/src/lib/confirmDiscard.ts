import { Alert, Platform } from 'react-native';

/**
 * Closes an edit sheet straight away when nothing changed; otherwise asks
 * "Discard changes?" first. (`Alert` is a no-op on web, so the web preview
 * falls back to the browser's confirm dialog.)
 */
export function confirmDiscard(dirty: boolean, onDiscard: () => void) {
  if (!dirty) {
    onDiscard();
    return;
  }
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.('Discard your unsaved changes?')) onDiscard();
    return;
  }
  Alert.alert('Discard changes?', 'Your edits to this entry haven’t been saved.', [
    { text: 'Keep editing', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: onDiscard },
  ]);
}
