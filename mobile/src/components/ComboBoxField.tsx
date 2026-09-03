import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  type KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, surfaces } from '@shared/theme';
import { FilterCheckbox } from './FilterCheckbox';
import { SearchIcon } from './SearchIcon';
import { SortChevron } from './SortChevron';
import { DetachedSheetBackground } from './surfaces/DetachedSheetBackground';
import { DetachedSheetContentClip } from './surfaces/DetachedSheetContentClip';
import { SheetHeader } from './surfaces/SheetHeader';
import { floatingSurfaceStyles } from './surfaces/floatingSurfaceStyles';

interface CommonProps {
  label: string;
  options: string[];
  placeholder?: string;
  /** Optional leading glyph per option (e.g. country flags). */
  flagFor?: (option: string) => string;
  /** Optional display transform for an option (the raw option stays the committed value). */
  formatOption?: (option: string) => string;
  /** Aligns the trigger's value text. Defaults to left. */
  align?: 'left' | 'right';
  /** Keyboard for the search/add input — e.g. 'decimal-pad' for numeric fields. */
  keyboardType?: KeyboardTypeOptions;
}

type ComboBoxFieldProps = CommonProps &
  (
    | { multiple?: false; value: string; onChange: (value: string) => void }
    | { multiple: true; value: string[]; onChange: (value: string[]) => void }
  );

export function ComboBoxField(props: ComboBoxFieldProps) {
  const { label, options, placeholder, flagFor, formatOption, align = 'left', keyboardType } = props;
  const display = useCallback((opt: string) => formatOption?.(opt) ?? opt, [formatOption]);
  const numeric = keyboardType != null;
  const multiple = props.multiple === true;
  const selected = useMemo(
    () => (multiple ? props.value : props.value ? [props.value] : []),
    [multiple, props.value],
  );
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { height: screenH } = useWindowDimensions();
  const modalRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<TextInput>(null);
  const shouldFocusRef = useRef(false);
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

  // Surface any custom values not in the known options — ones the user added,
  // or (single-select) a value pre-filled from an extracted link — so they
  // render as active rows alongside the known options rather than vanishing.
  const baseOptions = useMemo(() => {
    const extras = selected.filter((s) => !options.includes(s));
    return extras.length ? [...extras, ...options] : options;
  }, [options, selected]);

  const filtered = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return baseOptions;
    return baseOptions.filter((option) =>
      `${option} ${display(option)}`.toLowerCase().includes(q),
    );
  }, [baseOptions, trimmedQuery, display]);

  const showAddCustom =
    trimmedQuery.length > 0 &&
    !baseOptions.some((option) => option.toLowerCase() === trimmedQuery.toLowerCase());

  const present = useCallback(() => {
    // Drop any keyboard from a previously focused field (e.g. the Bean name
    // input) so the detached sheet doesn't open hidden behind it.
    Keyboard.dismiss();
    // A single-select value that isn't one of the known options — e.g. a long
    // Process pre-filled from an extracted link — only shows truncated in the
    // trigger. Seed the search box with it (and focus below) so its full text
    // is visible and editable. Otherwise start empty so the full list shows
    // first — searching/adding is the secondary action.
    const current = props.multiple ? '' : props.value;
    const isCustom =
      current.length > 0 && !options.some((o) => o.toLowerCase() === current.toLowerCase());
    setQuery(isCustom ? current : '');
    shouldFocusRef.current = isCustom;
    setOpen(true);
  }, [props.multiple, props.value, options]);

  useEffect(() => {
    if (!open) return;
    // Present without auto-focusing the input: the sheet opens showing the
    // options with the keyboard down. It only rises when the user taps search.
    modalRef.current?.present();
    // Exception: when we seeded the search box with a custom value to edit,
    // focus it so it's immediately editable. Delay past the present animation
    // so the keyboard rises with the settled sheet rather than behind it.
    if (shouldFocusRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Suspend the host modal's swipe-to-dismiss while the option sheet is open, so
  // over-dragging the sheet down only dismisses the sheet — not the whole modal
  // underneath. Restored on close (and on unmount via the cleanup).
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !open });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation, open]);

  const handleDismiss = useCallback(() => {
    shouldFocusRef.current = false;
    setOpen(false);
  }, []);

  // Single-select: commit and close. Multi-select: toggle membership, stay open.
  const choose = useCallback(
    (next: string) => {
      if (props.multiple) {
        props.onChange(
          props.value.includes(next)
            ? props.value.filter((v) => v !== next)
            : [...props.value, next],
        );
      } else {
        props.onChange(next);
        modalRef.current?.dismiss();
      }
    },
    [props],
  );

  // Add-a-custom-value action. In multi-select it appends and clears the
  // search so the new row joins the list; single-select commits and closes.
  const addCustom = useCallback(() => {
    if (!trimmedQuery) return;
    choose(trimmedQuery);
    if (props.multiple) setQuery('');
  }, [choose, trimmedQuery, props.multiple]);

  // Multi-select only: drop every selection, matching the filter sheet's Clear.
  const clearAll = useCallback(() => {
    if (props.multiple) props.onChange([]);
  }, [props]);

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
        accessibilityLabel={
          selected.length
            ? `${label}, ${selected.map(display).join(', ')}`
            : `${label}, none selected`
        }
      >
        <Text
          style={[
            styles.triggerText,
            // Keep the placeholder left-aligned; right-align only once a value is set.
            align === 'right' && selected.length > 0 && styles.triggerTextRight,
            selected.length === 0 && styles.triggerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selected.length
            ? selected.map(display).join(', ')
            : placeholder || `Select ${label.toLowerCase()}`}
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
            <SheetHeader
              title={label}
              subtitle={
                multiple && selected.length > 0
                  ? `${selected.length} of ${baseOptions.length} selected`
                  : undefined
              }
              onClear={multiple ? clearAll : undefined}
              clearAccessibilityLabel={`Clear ${label} selection`}
              showClear={multiple && selected.length > 0}
              animatedClear
            />

            <View style={styles.searchRow}>
              <SearchIcon size={18} color={colors.greyDark} strokeWidth={2} />
              <BottomSheetTextInput
                ref={inputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={`Type to search or add ${label.toLowerCase()}`}
                placeholderTextColor={colors.greyDark}
                keyboardType={keyboardType}
                autoCapitalize={numeric ? 'none' : 'words'}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={addCustom}
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
                  onPress={addCustom}
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
                const isActive = selected.includes(option);
                const flag = flagFor?.(option) || '';
                return (
                  <Pressable
                    key={option}
                    onPress={() => choose(option)}
                    accessibilityRole={multiple ? 'checkbox' : 'button'}
                    accessibilityState={multiple ? { checked: isActive } : { selected: isActive }}
                    accessibilityLabel={display(option)}
                    style={[
                      floatingSurfaceStyles.optionRow,
                      i === 0 && !showAddCustom && floatingSurfaceStyles.optionRowFirst,
                    ]}
                  >
                    {flag ? <Text style={floatingSurfaceStyles.optionFlag}>{flag}</Text> : null}
                    <Text style={floatingSurfaceStyles.optionLabel} numberOfLines={1}>
                      {display(option)}
                    </Text>
                    {multiple || isActive ? (
                      <FilterCheckbox checked={isActive} />
                    ) : null}
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
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.14)',
    backgroundColor: surfaces.pillFill,
    minHeight: 43,
  },
  triggerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  triggerTextRight: {
    textAlign: 'right',
  },
  triggerPlaceholder: {
    color: colors.greyDark,
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
    fontWeight: '800',
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
    fontWeight: '500',
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
