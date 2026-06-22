import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { type ComponentRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { FilterKey, FILTER_TITLE, filterOptions } from '../lib/coffeeFilters';
import { FilterCheckbox } from './FilterCheckbox';
import { SearchIcon } from './SearchIcon';
import { DetachedSheetBackground } from './surfaces/DetachedSheetBackground';
import { DetachedSheetContentClip } from './surfaces/DetachedSheetContentClip';
import { SheetHeader } from './surfaces/SheetHeader';
import { floatingSurfaceStyles } from './surfaces/floatingSurfaceStyles';

const GRABBER_ROW_H = 10 + 5 + 4; // grabberRow paddingTop + grabber + paddingBottom
const FILTER_HEADER_H = 10 + 58 + 10; // header paddingVertical + titleWrapper minHeight (subtitle always present)
const SEARCH_ROW_H = 10 + 20 + 10 + 8; // searchRow paddingVertical + input + marginBottom
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
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null);
  const [renderedKey, setRenderedKey] = useState<FilterKey | null>(filterKey);
  const [query, setQuery] = useState('');

  useLayoutEffect(() => {
    if (filterKey) {
      setRenderedKey(filterKey);
      setQuery('');
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

  const trimmedQuery = query.trim();

  const filtered = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return values;
    return values.filter((val) => val.toLowerCase().includes(q));
  }, [values, trimmedQuery]);

  // Offer a bulk action once a search narrows the list to more than one match.
  const showSelectAll = trimmedQuery.length > 0 && filtered.length > 1;
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((val) => activeValues.includes(val));

  const sheetBottomInset = 16;
  const sheetTopInset = insets.top + 16;

  const snapPoints = useMemo(() => {
    const fullSnapH = screenH - sheetBottomInset - sheetTopInset;
    const peekH = Math.round(fullSnapH * 0.4);
    const contentH =
      GRABBER_ROW_H +
      FILTER_HEADER_H +
      SEARCH_ROW_H +
      values.length * ROW_H +
      SHEET_BOTTOM_PAD;
    const hugH = Math.min(contentH, fullSnapH);
    return hugH <= peekH ? [hugH] : [peekH, hugH];
  }, [values.length, screenH, sheetBottomInset, sheetTopInset]);

  const handleToggleAll = useCallback(() => {
    if (allFilteredSelected) {
      onSelect(activeValues.filter((v) => !filtered.includes(v)));
    } else {
      onSelect([...new Set([...activeValues, ...filtered])]);
    }
  }, [allFilteredSelected, activeValues, filtered, onSelect]);

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
    setQuery('');
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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
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
        <View style={filterSheetStyles.searchRow}>
          <SearchIcon size={18} color={colors.greyDark} strokeWidth={2} />
          <BottomSheetTextInput
            ref={inputRef}
            style={filterSheetStyles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${FILTER_TITLE[renderedKey].toLowerCase()}`}
            placeholderTextColor={colors.greyDark}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              hitSlop={8}
              style={filterSheetStyles.clearSearch}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={filterSheetStyles.clearSearchText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <BottomSheetScrollView
          contentContainerStyle={[filterSheetStyles.listContent, { paddingBottom: SHEET_BOTTOM_PAD }]}
          keyboardShouldPersistTaps="handled"
        >
          {showSelectAll ? (
            <Pressable
              onPress={handleToggleAll}
              accessibilityRole="button"
              accessibilityLabel={
                allFilteredSelected
                  ? `Deselect all ${filtered.length} results`
                  : `Select all ${filtered.length} results`
              }
              style={[floatingSurfaceStyles.optionRow, floatingSurfaceStyles.optionRowFirst]}
            >
              <Text style={filterSheetStyles.selectAllLabel}>
                {allFilteredSelected ? 'Deselect all' : 'Select all'}
              </Text>
              <Text style={filterSheetStyles.selectAllCount}>{filtered.length}</Text>
            </Pressable>
          ) : null}
          {filtered.map((val, i) => {
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
                  i === 0 && !showSelectAll && floatingSurfaceStyles.optionRowFirst,
                  i === filtered.length - 1 && filterSheetStyles.optionRowLast,
                ]}
              >
                {flag ? <Text style={floatingSurfaceStyles.optionFlag}>{flag}</Text> : null}
                <Text style={floatingSurfaceStyles.optionLabel}>{val}</Text>
                <FilterCheckbox checked={isActive} />
              </Pressable>
            );
          })}
          {filtered.length === 0 ? (
            <Text style={filterSheetStyles.emptyText}>
              No matches for “{trimmedQuery}”.
            </Text>
          ) : null}
        </BottomSheetScrollView>
      </DetachedSheetContentClip>
    </BottomSheetModal>
  );
}

const filterSheetStyles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(120,120,128,0.1)',
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    padding: 0,
  },
  clearSearch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(120,120,128,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.pearl,
    lineHeight: 14,
  },
  listContent: {
    flexGrow: 0,
  },
  selectAllLabel: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '600',
    color: colors.burgundy,
  },
  selectAllCount: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.burgundy,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: colors.greyDark,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
});
