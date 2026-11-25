import { createContext, RefObject, useCallback, useContext, useEffect, useRef } from 'react';
import { Keyboard, NativeMethods, TextInput } from 'react-native';

/**
 * Keeps the currently focused field above the keyboard. Text fields in a
 * keyboard-aware form call this on every keystroke (and multiline fields on
 * each content-size change), so typing into a field that's behind the keyboard
 * — because it grew a line, or because the user scrolled it there — brings it
 * back into view.
 */
export type KeyboardAwareUpdate = () => void;

const noop: KeyboardAwareUpdate = () => {};

export const KeyboardAwareUpdateContext = createContext<KeyboardAwareUpdate>(noop);

export function useKeyboardAwareUpdate(): KeyboardAwareUpdate {
  return useContext(KeyboardAwareUpdateContext);
}

/**
 * Wraps a single-line field's `onChangeText` so each keystroke also keeps the
 * field above the keyboard: `onChangeText={withKeepInView(setName)}`.
 * A no-op outside a keyboard-aware form.
 */
export function useKeepInViewOnChange(): (
  onChangeText: (text: string) => void,
) => (text: string) => void {
  const keepInView = useKeyboardAwareUpdate();
  return useCallback(
    (onChangeText) => (text) => {
      onChangeText(text);
      keepInView();
    },
    [keepInView],
  );
}

/**
 * The parts of react-native-keyboard-aware-scroll-view's HOC instance we use.
 * `position` is tracked by the HOC from onScroll but omitted from its .d.ts.
 */
export interface KeyboardAwareScrollHandle {
  scrollToPosition: (x: number, y: number, animated?: boolean) => void;
  getScrollResponder: () =>
    | {
        getNativeScrollRef?: () => NativeMethods | null;
        getInnerViewRef?: () => NativeMethods | null;
      }
    | null
    | undefined;
  position?: { x: number; y: number };
}

/** Lets the library's own on-focus scroll finish before we correct it. */
const AFTER_KEYBOARD_SHOW_MS = 300;
/** Roughly how long an animated scroll takes; repeat requests for the same target inside it are skipped. */
const SCROLL_ANIMATION_MS = 400;
/** Sub-point differences are measurement noise, not a reason to scroll. */
const TOLERANCE = 1;

/**
 * Builds the `KeyboardAwareUpdate` for a keyboard-aware scroll view.
 *
 * Deliberately avoids the library's `update()` and any screen-coordinate math:
 * inside our iOS `pageSheet` modals, `measureInWindow` is sheet-relative while
 * the keyboard reports screen coordinates, so mixing them leaves the field
 * behind the keyboard by about the sheet's top offset.
 *
 * Instead it computes an *absolute* scroll target from the input's position in
 * the scroll content (`measureLayout` against the content container — fixed
 * regardless of the current scroll offset) and the visible height above the
 * keyboard (the keyboard covers the bottom `keyboard.height` of the scroll
 * view, since every keyboard-aware form runs to the bottom of its sheet).
 * Because the target doesn't depend on a mid-animation offset, rapid repeat
 * calls (each keystroke, plus a content-size change on a new line) agree with
 * each other instead of stacking slightly different scrolls — which read as a
 * shaky animation. If the field is already visible, nothing moves.
 */
export function useKeepFocusedInputAboveKeyboard(
  scrollRef: RefObject<KeyboardAwareScrollHandle | null>,
  margin = 32,
): KeyboardAwareUpdate {
  const pending = useRef(false);
  const lastScroll = useRef<{ target: number; at: number } | null>(null);

  const keepInView = useCallback(() => {
    // Several triggers can land in one frame (keystroke + new line); measure once.
    if (pending.current) return;
    pending.current = true;
    // Wait a frame so a new line's height is laid out before measuring.
    requestAnimationFrame(() => {
      pending.current = false;
      const input = TextInput.State.currentlyFocusedInput();
      const keyboard = Keyboard.metrics();
      const scroll = scrollRef.current;
      const responder = scroll?.getScrollResponder();
      const scrollHost = responder?.getNativeScrollRef?.();
      const content = responder?.getInnerViewRef?.();
      if (!input || !keyboard || !scroll || !scrollHost || !content) return;

      scrollHost.measureInWindow((_sx, _sy, _sw, scrollHeight) => {
        input.measureLayout(
          content,
          (_ix, inputTop, _iw, inputHeight) => {
            const visibleHeight = scrollHeight - keyboard.height;
            const target = inputTop + inputHeight + margin - visibleHeight;
            const currentY = scroll.position?.y ?? 0;
            // Already visible: leave the user's scroll position alone.
            if (target <= currentY + TOLERANCE) return;
            // Already animating to (about) this spot: re-issuing would restart the animation.
            const last = lastScroll.current;
            const now = Date.now();
            if (
              last &&
              Math.abs(last.target - target) <= TOLERANCE &&
              now - last.at < SCROLL_ANIMATION_MS
            ) {
              return;
            }
            lastScroll.current = { target, at: now };
            scroll.scrollToPosition(0, target, true);
          },
          () => {},
        );
      });
    });
  }, [scrollRef, margin]);

  // Also correct the initial focus: the library's on-focus scroll uses the
  // same screen-vs-sheet math and can leave a low field partly covered.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      clearTimeout(timer);
      timer = setTimeout(keepInView, AFTER_KEYBOARD_SHOW_MS);
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [keepInView]);

  return keepInView;
}
