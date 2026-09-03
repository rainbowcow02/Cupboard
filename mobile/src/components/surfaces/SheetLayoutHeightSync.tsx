import {
  INITIAL_LAYOUT_VALUE,
  useBottomSheetInternal,
  useBottomSheetModalInternal,
} from '@gorhom/bottom-sheet';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Dimensions, useWindowDimensions } from 'react-native';
import { useAnimatedReaction, type SharedValue } from 'react-native-reanimated';

/**
 * Window height used to pin the root sheet provider.
 *
 * Native page sheets can scale the presenter and briefly shrink `window`.
 * `screen` is the display size and does not follow that transform, so the
 * larger of the two is the real device height. Both swap together on rotation.
 */
function useDeviceHeight() {
  const { height: windowHeight } = useWindowDimensions();
  return Math.max(windowHeight, Dimensions.get('screen').height);
}

function heightsDiffer(a: number, b: number) {
  'worklet';
  return Math.abs(a - b) >= 1;
}

type ContainerLayout = SharedValue<{
  height: number;
  offset: { top: number; bottom: number; left: number; right: number };
}>;

function pinProviderToDevice(containerLayoutState: ContainerLayout, deviceHeight: number) {
  containerLayoutState.modify((state) => {
    'worklet';
    if (state.height === INITIAL_LAYOUT_VALUE) return state;
    if (!heightsDiffer(state.height, deviceHeight)) return state;
    state.height = deviceHeight;
    state.offset = { top: 0, bottom: 0, left: 0, right: 0 };
    return state;
  });
}

/**
 * Mount once under the *root* `BottomSheetModalProvider` — not inside a
 * native-modal screen that has its own provider (bean detail, log-flow).
 *
 * Those nested providers must keep measuring their page sheet. This one
 * fills the window, so its `containerLayoutState.height` is always the
 * device height. A detached sheet's bottom edge is
 * `topInset + (providerHeight - topInset - bottomInset)` = `providerHeight
 * - bottomInset`; pinning the provider to the device height is what keeps
 * Home sheets 16pt off the bottom after a page-sheet round trip.
 */
export function SheetProviderLayoutSync() {
  const { containerLayoutState } = useBottomSheetModalInternal();
  const deviceHeight = useDeviceHeight();

  useAnimatedReaction(
    () => containerLayoutState.get().height,
    (height) => {
      if (height === INITIAL_LAYOUT_VALUE) return;
      if (!heightsDiffer(height, deviceHeight)) return;
      containerLayoutState.modify((state) => {
        'worklet';
        state.height = deviceHeight;
        state.offset = { top: 0, bottom: 0, left: 0, right: 0 };
        return state;
      });
    },
    [containerLayoutState, deviceHeight],
  );

  return null;
}

/**
 * Call from the tab navigator layout. Returning from bean detail / log-flow
 * focuses `(tabs)` again; pin on that tick so a late native onLayout cannot
 * leave the container short between the dismiss animation and the next
 * filter tap.
 */
export function usePinSheetContainerOnFocus() {
  const { containerLayoutState } = useBottomSheetModalInternal();
  const deviceHeight = useDeviceHeight();

  useFocusEffect(
    useCallback(() => {
      pinProviderToDevice(containerLayoutState, deviceHeight);
    }, [containerLayoutState, deviceHeight]),
  );
}

interface SheetLayoutHeightSyncProps {
  /** The `topInset` passed to the enclosing `BottomSheetModal`. */
  topInset: number;
  /** The `bottomInset` passed to the enclosing `BottomSheetModal`. */
  bottomInset: number;
}

/**
 * Home-only backup: if a sheet snapshotted a short `containerHeight` before
 * the provider pin landed, write the device-relative height onto the sheet
 * itself. Do not use this inside nested modal providers (combo boxes on bean
 * detail / log-flow) — those containers are supposed to be shorter than the
 * window.
 */
export function SheetLayoutHeightSync({
  topInset,
  bottomInset,
}: SheetLayoutHeightSyncProps) {
  const { animatedLayoutState } = useBottomSheetInternal();
  const { containerLayoutState } = useBottomSheetModalInternal();
  const deviceHeight = useDeviceHeight();

  useAnimatedReaction(
    () => containerLayoutState.get().height,
    (providerHeight) => {
      if (providerHeight === INITIAL_LAYOUT_VALUE) return;
      if (!heightsDiffer(providerHeight, deviceHeight)) return;
      containerLayoutState.modify((state) => {
        'worklet';
        state.height = deviceHeight;
        state.offset = { top: 0, bottom: 0, left: 0, right: 0 };
        return state;
      });
    },
    [containerLayoutState, deviceHeight],
  );

  useAnimatedReaction(
    () => animatedLayoutState.get().containerHeight,
    (containerHeight) => {
      if (containerHeight === INITIAL_LAYOUT_VALUE) return;
      const expectedHeight = deviceHeight - topInset - bottomInset;
      if (containerHeight >= expectedHeight) return;
      animatedLayoutState.modify((state) => {
        'worklet';
        state.containerHeight = expectedHeight;
        return state;
      });
    },
    [animatedLayoutState, deviceHeight, topInset, bottomInset],
  );

  return null;
}
