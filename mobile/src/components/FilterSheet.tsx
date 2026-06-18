import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { FilterKey, FILTER_TITLE, filterOptions } from '../lib/coffeeFilters';
import { tabBarChromeInset } from '../lib/chromeInsets';
import { FilterCheckbox } from './FilterCheckbox';
import { DetachedSheetBackground } from './surfaces/DetachedSheetBackground';
import { DetachedSheetContentClip } from './surfaces/DetachedSheetContentClip';
import { SheetHeader } from './surfaces/SheetHeader';
import { floatingSurfaceStyles } from './surfaces/floatingSurfaceStyles';

const HEADER_H = 84;
const ROW_H = 49;
const LIST_CAP = 280;

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

  const snapPoints = useMemo(() => {
    const collapsed = HEADER_H + Math.min(LIST_CAP, values.length * ROW_H);
    const expanded = screenH - tabBarChromeInset(insets) - insets.top - 16;
    return [collapsed, expanded];
  }, [values.length, screenH, insets]);

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
      snapPoints={snapPoints}
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
        <SheetHeader
          title={FILTER_TITLE[renderedKey]}
          onClear={() => onSelect([])}
          clearAccessibilityLabel={`Clear ${FILTER_TITLE[renderedKey]} filter`}
          showClear={activeValues.length > 0}
          animatedClear
        />
        <BottomSheetScrollView>
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
      </DetachedSheetContentClip>
    </BottomSheetModal>
  );
}
