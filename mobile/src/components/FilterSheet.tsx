import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { FilterKey, FILTER_TITLE, filterOptions } from '../lib/coffeeFilters';
import { tabBarChromeInset } from '../lib/chromeInsets';
import { FilterCheckbox } from './FilterCheckbox';
import { DetachedSheetBackground } from './surfaces/DetachedSheetBackground';
import { DetachedSheetContentClip } from './surfaces/DetachedSheetContentClip';
import { SheetHeader } from './surfaces/SheetHeader';
import { floatingSurfaceStyles } from './surfaces/floatingSurfaceStyles';

const FILTER_HEADER_H = 10 + 44 + 10; // header paddingVertical + clear button
const ROW_H = 14 + 14 + 20 + StyleSheet.hairlineWidth * 2; // option row padding + label
const LIST_MAX = 280;
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

  const listContentH = values.length * ROW_H;
  const needsScroll = listContentH > LIST_MAX;
  const maxDynamicContentSize = useMemo(
    () => FILTER_HEADER_H + Math.min(LIST_MAX, listContentH) + SHEET_BOTTOM_PAD,
    [listContentH],
  );

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
      enableDynamicSizing
      maxDynamicContentSize={maxDynamicContentSize}
      enablePanDownToClose
      detached
      bottomInset={tabBarChromeInset(insets)}
      topInset={insets.top + 16}
      backgroundComponent={DetachedSheetBackground}
      handleComponent={renderHandle}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      style={floatingSurfaceStyles.sheetDetached}
    >
      <DetachedSheetContentClip>
        <BottomSheetView>
          <SheetHeader
            title={FILTER_TITLE[renderedKey]}
            onClear={() => onSelect([])}
            clearAccessibilityLabel={`Clear ${FILTER_TITLE[renderedKey]} filter`}
            showClear={activeValues.length > 0}
            animatedClear
          />
          <BottomSheetScrollView
            scrollEnabled={needsScroll}
            style={needsScroll ? filterSheetStyles.scrollListMax : undefined}
            contentContainerStyle={filterSheetStyles.listContent}
          >
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
                  style={[floatingSurfaceStyles.optionRow, i === 0 && floatingSurfaceStyles.optionRowFirst]}
                >
                  {flag ? <Text style={floatingSurfaceStyles.optionFlag}>{flag}</Text> : null}
                  <Text style={floatingSurfaceStyles.optionLabel}>{val}</Text>
                  <FilterCheckbox checked={isActive} />
                </Pressable>
              );
            })}
          </BottomSheetScrollView>
        </BottomSheetView>
      </DetachedSheetContentClip>
    </BottomSheetModal>
  );
}

const filterSheetStyles = StyleSheet.create({
  scrollListMax: {
    maxHeight: LIST_MAX,
  },
  listContent: {
    paddingBottom: SHEET_BOTTOM_PAD,
  },
});

const filterSheetStyles = StyleSheet.create({
  scrollListMax: {
    maxHeight: LIST_MAX,
  },
  listContent: {
    flexGrow: 0,
    paddingBottom: SHEET_BOTTOM_PAD,
  },
});
