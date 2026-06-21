import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { FilterKey, FILTER_TITLE, filterOptions } from '../lib/coffeeFilters';
import { FilterCheckbox } from './FilterCheckbox';
import { DetachedSheetBackground } from './surfaces/DetachedSheetBackground';
import { DetachedSheetContentClip } from './surfaces/DetachedSheetContentClip';
import { SheetHeader } from './surfaces/SheetHeader';
import { floatingSurfaceStyles } from './surfaces/floatingSurfaceStyles';

const GRABBER_ROW_H = 10 + 5 + 4; // grabberRow paddingTop + grabber + paddingBottom
const FILTER_HEADER_H = 10 + 50 + 10; // header paddingVertical + (title 30 + subtitle 20)
const ROW_H = 14 + 14 + 20 + StyleSheet.hairlineWidth * 2; // option row padding + label
const SHEET_BOTTOM_PAD = 16;

interface FilterSheetProps {
  filterKey: FilterKey | null;
  coffees: Coffee[];
  activeValues: string[];
  onSelect: (values: string[]) => void;
  onClose: () => void;
}

function FilterSheetHandle({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={floatingSurfaceStyles.grabberRow}
      accessibilityRole="button"
      accessibilityLabel="Close filter sheet"
    >
      <View style={floatingSurfaceStyles.grabber} />
    </Pressable>
  );
}

export function FilterSheet({
  filterKey,
  coffees,
  activeValues,
  onSelect,
  onClose,
}: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const modalRef = useRef<BottomSheetModal>(null);
  const [renderedKey, setRenderedKey] = useState<FilterKey | null>(filterKey);

  useLayoutEffect(() => {
    if (filterKey) {
      setRenderedKey(filterKey);
    } else {
      modalRef.current?.dismiss();
    }
  }, [filterKey]);

  useLayoutEffect(() => {
    if (renderedKey && filterKey) {
      modalRef.current?.present();
    }
  }, [renderedKey, filterKey]);

  const values = useMemo(
    () => (renderedKey ? filterOptions(coffees, renderedKey) : []),
    [coffees, renderedKey],
  );

  const sheetBottomInset = 16;
  const sheetTopInset = insets.top + 16;

  const snapPoints = useMemo(() => {
    const fullSnapH = screenH - sheetBottomInset - sheetTopInset;
    const peekH = Math.round(fullSnapH * 0.5);
    const contentH =
      GRABBER_ROW_H + FILTER_HEADER_H + values.length * ROW_H + SHEET_BOTTOM_PAD;
    const hugH = Math.min(contentH, fullSnapH);
    return hugH <= peekH ? [hugH] : [peekH, hugH];
  }, [values.length, screenH, sheetBottomInset, sheetTopInset]);

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

  const handleDismiss = useCallback(() => {
    setRenderedKey(null);
    onClose();
  }, [onClose]);

  const renderHandle = useCallback(
    () => <FilterSheetHandle onPress={onClose} />,
    [onClose],
  );

  if (!renderedKey) return null;

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing={false}
      snapPoints={snapPoints}
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
        <SheetHeader
          title={FILTER_TITLE[renderedKey]}
          subtitle={
            activeValues.length > 0
              ? `${activeValues.length} of ${values.length} selected`
              : `${values.length} results`
          }
          onClear={() => onSelect([])}
          clearAccessibilityLabel={`Clear ${FILTER_TITLE[renderedKey]} filter`}
          showClear={activeValues.length > 0}
          animatedClear
        />
        <BottomSheetScrollView contentContainerStyle={[filterSheetStyles.listContent, { paddingBottom: SHEET_BOTTOM_PAD + insets.bottom }]}>
          {values.map((val, i) => {
            const isActive = activeValues.includes(val);
            const flag = renderedKey === 'country' ? ORIGIN_FLAGS[val] || '' : '';
            return (
              <Pressable
                key={val}
                onPress={() => {
                  const next = isActive
                    ? activeValues.filter((v) => v !== val)
                    : [...activeValues, val];
                  onSelect(next);
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isActive }}
                accessibilityLabel={val}
                style={[
                  floatingSurfaceStyles.optionRow,
                  i === 0 && floatingSurfaceStyles.optionRowFirst,
                  i === values.length - 1 && filterSheetStyles.optionRowLast,
                ]}
              >
                {flag ? <Text style={floatingSurfaceStyles.optionFlag}>{flag}</Text> : null}
                <Text style={floatingSurfaceStyles.optionLabel}>{val}</Text>
                <FilterCheckbox checked={isActive} />
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </DetachedSheetContentClip>
    </BottomSheetModal>
  );
}

const filterSheetStyles = StyleSheet.create({
  listContent: {
    flexGrow: 0,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
});
