import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, surfaces, type CupRatingValue } from '@shared/theme';
import { CupRating } from './CupRating';
import { FilterCheckbox } from './FilterCheckbox';
import { SortChevron } from './SortChevron';
import { DetachedSheetBackground } from './surfaces/DetachedSheetBackground';
import { DetachedSheetContentClip } from './surfaces/DetachedSheetContentClip';
import { SheetHeader } from './surfaces/SheetHeader';
import { floatingSurfaceStyles } from './surfaces/floatingSurfaceStyles';

interface Props {
  /** 0 means unrated. */
  value: number;
  onChange: (value: number) => void;
}

const RATING_OPTIONS: CupRatingValue[] = [5, 4, 3, 2, 1];

/**
 * Dropdown selector for a brew's rating, presented as tinted ☕️ cup pills
 * (matching the read-only `CupRating` badge shown on brew cards) instead of stars.
 */
export function CupRatingField({ value, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const modalRef = useRef<BottomSheetModal>(null);
  const [open, setOpen] = useState(false);

  // Float at the screen bottom overlaying the tab bar, matching ComboBoxField's sheet.
  const sheetBottomInset = 16;
  const sheetTopInset = insets.top + 16;

  const present = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (open) modalRef.current?.present();
  }, [open]);

  // Suspend the host modal's swipe-to-dismiss while this sheet is open, matching
  // ComboBoxField, so over-dragging only dismisses this sheet.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !open });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation, open]);

  const handleDismiss = useCallback(() => setOpen(false), []);

  const choose = useCallback(
    (next: CupRatingValue) => {
      onChange(next === value ? 0 : next);
      modalRef.current?.dismiss();
    },
    [onChange, value],
  );

  const clear = useCallback(() => {
    onChange(0);
    modalRef.current?.dismiss();
  }, [onChange]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.12}
        pressBehavior="close"
      />
    ),
    [],
  );

  const renderHandle = useCallback(
    () => (
      <Pressable
        onPress={() => modalRef.current?.dismiss()}
        style={floatingSurfaceStyles.grabberRow}
        accessibilityRole="button"
        accessibilityLabel="Close rating picker"
      >
        <View style={floatingSurfaceStyles.grabber} />
      </Pressable>
    ),
    [],
  );

  return (
    <>
      <Pressable
        onPress={present}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={value > 0 ? `Rating, ${value} out of 5 cups` : 'Rating, not yet rated'}
      >
        <View style={styles.triggerValue}>
          {value > 0 ? (
            <CupRating rating={value} />
          ) : (
            <Text style={styles.triggerPlaceholder}>How was it?</Text>
          )}
        </View>
        <SortChevron flipped={false} color={colors.greyDark} />
      </Pressable>

      {open ? (
        <BottomSheetModal
          ref={modalRef}
          enableDynamicSizing
          enablePanDownToClose
          detached
          bottomInset={sheetBottomInset}
          topInset={sheetTopInset}
          backgroundComponent={DetachedSheetBackground}
          handleComponent={renderHandle}
          backdropComponent={renderBackdrop}
          onDismiss={handleDismiss}
          style={floatingSurfaceStyles.sheetDetached}
        >
          <DetachedSheetContentClip>
            <BottomSheetView>
              <SheetHeader
                title="Rating"
                onClear={value > 0 ? clear : undefined}
                clearAccessibilityLabel="Clear rating"
                showClear={value > 0}
              />

              <View style={styles.listContent}>
                {RATING_OPTIONS.map((n, i) => {
                  const isActive = value === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => choose(n)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`${n} out of 5 cups`}
                      style={[
                        floatingSurfaceStyles.optionRow,
                        styles.optionRow,
                        i === 0 && floatingSurfaceStyles.optionRowFirst,
                      ]}
                    >
                      <CupRating rating={n} />
                      <FilterCheckbox checked={isActive} />
                    </Pressable>
                  );
                })}
              </View>
            </BottomSheetView>
          </DetachedSheetContentClip>
        </BottomSheetModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.14)',
    backgroundColor: surfaces.pillFill,
    minHeight: 43,
  },
  triggerValue: {
    flex: 1,
    alignItems: 'flex-start',
  },
  triggerPlaceholder: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    color: colors.greyDark,
  },
  optionRow: {
    justifyContent: 'space-between',
  },
  listContent: {
    paddingBottom: 16,
  },
});
