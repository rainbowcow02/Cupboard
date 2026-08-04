import { createContext, useContext } from 'react';

/**
 * Re-measures the currently focused field against the nearest keyboard-aware
 * scroll ancestor and re-scrolls it into view. The scroll libraries only do
 * this automatically when the keyboard first shows — a multiline field that
 * grows taller as the user types (Tasting/Brew notes, the pour note) needs
 * to trigger it again on each content-size change, or lines typed past the
 * initial height end up hidden behind the keyboard.
 */
export type KeyboardAwareUpdate = () => void;

const noop: KeyboardAwareUpdate = () => {};

export const KeyboardAwareUpdateContext = createContext<KeyboardAwareUpdate>(noop);

export function useKeyboardAwareUpdate(): KeyboardAwareUpdate {
  return useContext(KeyboardAwareUpdateContext);
}
