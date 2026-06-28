import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@shared/theme';
import { SearchIcon } from './SearchIcon';
import { SortChevron } from './SortChevron';
import { DetachedSheetBackground } from './surfaces/DetachedSheetBackground';
import { DetachedSheetContentClip } from './surfaces/DetachedSheetContentClip';
import { floatingSurfaceStyles } from './surfaces/floatingSurfaceStyles';

interface ComboBoxFieldProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  /** Optional leading glyph per option (e.g. country flags). */
  flagFor?: (option: string) => string;
}

export function ComboBoxField({
  label,
  value,
  options,
  placeholder,
  onChange,
  flagFor,
}: ComboBoxFieldProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const modalRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<TextInput>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Float at the screen bottom overlaying the tab bar, matching the Home
  // filter sheet, so the option list reads as the primary surface.
  const sheetBottomInset = 16;
  const sheetTopInset = insets.top + 16;

  const snapPoints = useMemo(() => {
    const fullSnapH = screenH - sheetBottomInset - sheetTopInset;
    return [Math.round(fullSnapH * 0.6), Math.round(fullSnapH * 0.92)];
  }, [screenH, sheetTopInset]);

  const trimmedQuery = query.trim();

  const filtered = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, trimmedQuery]);

  const showAddCustom =
    trimmedQuery.length > 0 &&
    !options.some((option) => option.toLowerCase() === trimmedQuery.toLowerCase());

  const present = useCallback(() => {
    // Start with an empty query so the full option list shows first —
    // searching/adding is the secondary action.
    setQuery('');
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Present without auto-focusing the input: the sheet opens showing the
    // options with the keyboard down. It only rises when the user taps search.
    modalRef.current?.present();
  }, [open]);

  const handleDismiss = useCallback(() => setOpen(false), []);

  const choose = useCallback(
    (next: string) => {
      onChange(next);
      modalRef.current?.dismiss();
    },
    [onChange],
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

  const renderHandle = useCallback(
    () => (
      <Pressable
        onPress={() => modalRef.current?.dismiss()}
        style={floatingSurfaceStyles.grabberRow}
        accessibilityRole="button"
        accessibilityLabel={`Close ${label} picker`}
      >
        <View style={floatingSurfaceStyles.grabber} />
      </Pressable>
    ),
    [label],
  );

  return (
    <>
      <Pressable
        onPress={present}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}, ${value}` : `${label}, none selected`}
      >
        <Text
          style={[styles.triggerText, !value && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {value || placeholder || `Select ${label.toLowerCase()}`}
        </Text>
        <SortChevron flipped={false} color={colors.greyDark} />
      </Pressable>

      {open ? (
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
            <View style={styles.headerRow}>
              <Text style={floatingSurfaceStyles.title}>{label}</Text>
            </View>

            <View style={styles.searchRow}>
              <SearchIcon size={18} color={colors.greyDark} strokeWidth={2} />
              <BottomSheetTextInput
                ref={inputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={`Type to search or add ${label.toLowerCase()}`}
                placeholderTextColor={colors.greyDark}
                autoCapitalize="words"
                autoCorrect={false}
                selectTextOnFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (trimmedQuery) choose(trimmedQuery);
                }}
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  hitSlop={8}
                  style={styles.clearSearch}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            <BottomSheetScrollView
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            >
              {showAddCustom ? (
                <Pressable
                  onPress={() => choose(trimmedQuery)}
                  style={[
                    floatingSurfaceStyles.optionRow,
                    floatingSurfaceStyles.optionRowFirst,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${trimmedQuery}`}
                >
                  <Text style={styles.addLabel} numberOfLines={1}>
                    Add “{trimmedQuery}”
                  </Text>
                </Pressable>
              ) : null}

              {filtered.map((option, i) => {
                const isActive = option === value;
                const flag = flagFor?.(option) || '';
                return (
                  <Pressable
                    key={option}
                    onPress={() => choose(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={option}
                    style={[
                      floatingSurfaceStyles.optionRow,
                      i === 0 && !showAddCustom && floatingSurfaceStyles.optionRowFirst,
                    ]}
                  >
                    {flag ? <Text style={floatingSurfaceStyles.optionFlag}>{flag}</Text> : null}
                    <Text style={floatingSurfaceStyles.optionLabel} numberOfLines={1}>
                      {option}
                    </Text>
                    {isActive ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}

              {filtered.length === 0 && !showAddCustom ? (
                <Text style={styles.emptyText}>
                  Type above to add a new {label.toLowerCase()}.
                </Text>
              ) : null}
            </BottomSheetScrollView>
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
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.14)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    minHeight: 46,
  },
  triggerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  triggerPlaceholder: {
    color: colors.greyDark,
  },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 10,
  },
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
    paddingBottom: 16,
  },
  addLabel: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '600',
    color: colors.burgundy,
  },
  check: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    color: colors.burgundy,
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
