import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { FilterKey, FILTER_TITLE, filterOptions } from '../lib/coffeeFilters';
import { FilterCheckbox } from './FilterCheckbox';
import { TAB_BAR_HEIGHT } from './TabBar';

interface FilterSheetProps {
  filterKey: FilterKey | null;
  coffees: Coffee[];
  activeValues: string[];
  onSelect: (values: string[]) => void;
  onClose: () => void;
}

export function FilterSheet({ filterKey, coffees, activeValues, onSelect, onClose }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [renderedKey, setRenderedKey] = useState<FilterKey | null>(filterKey);
  const progress = useSharedValue(filterKey ? 1 : 0);

  useEffect(() => {
    if (filterKey) {
      setRenderedKey(filterKey);
      progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else if (renderedKey) {
      progress.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setRenderedKey)(null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const values = useMemo(
    () => (renderedKey ? filterOptions(coffees, renderedKey) : []),
    [coffees, renderedKey],
  );

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.12 }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));
  const clearStyle = useAnimatedStyle(() => ({
    opacity: activeValues.length > 0 ? 1 : 0,
    transform: [{ scale: activeValues.length > 0 ? 1 : 0.5 }],
  }));

  if (!renderedKey) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close filter sheet"
      >
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          { bottom: insets.bottom + TAB_BAR_HEIGHT + 12 },
          sheetStyle,
        ]}
      >
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
        <View>
          <Pressable
            onPress={onClose}
            style={styles.grabberRow}
            accessibilityRole="button"
            accessibilityLabel="Close filter sheet"
          >
            <View style={styles.grabber} />
          </Pressable>
          <View style={styles.header}>
            <Text style={styles.title}>{FILTER_TITLE[renderedKey]}</Text>
            <Pressable
              onPress={() => onSelect([])}
              disabled={activeValues.length === 0}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${FILTER_TITLE[renderedKey]} filter`}
              style={styles.clearButton}
            >
              <Animated.View style={clearStyle}>
                <Text style={styles.clearButtonText}>✕</Text>
              </Animated.View>
            </Pressable>
          </View>
          <ScrollView style={styles.optionsScroll}>
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
                  style={[styles.optionRow, i === 0 && styles.optionRowFirst]}
                >
                  {flag ? <Text style={styles.optionFlag}>{flag}</Text> : null}
                  <Text style={styles.optionLabel}>{val}</Text>
                  <FilterCheckbox checked={isActive} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 34,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  glassTint: {
    backgroundColor: 'rgba(245,245,245,0.6)',
  },
  grabberRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 36,
    height: 5,
    backgroundColor: '#cccccc',
    borderRadius: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 12,
    paddingLeft: 24,
  },
  title: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.black,
    letterSpacing: -0.23,
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(120,120,128,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#727272',
  },
  optionsScroll: {
    maxHeight: 280,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingRight: 20,
    paddingLeft: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e7e7',
  },
  optionRowFirst: {
    borderTopWidth: 1,
    borderTopColor: '#e7e7e7',
  },
  optionFlag: {
    fontSize: 18,
  },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '500',
    color: colors.black,
  },
});
