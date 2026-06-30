import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '@shared/theme';
import { Filters, FilterKey, SortDir, SortMode } from '../lib/coffeeFilters';
import { SortChevron } from './SortChevron';

const SORT_CHIPS: { key: SortMode; label: string }[] = [
  { key: 'recent', label: 'recent' },
  { key: 'az', label: 'a-z' },
];

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'country', label: 'country' },
  { key: 'process', label: 'process' },
  { key: 'roast', label: 'roast' },
  { key: 'roaster', label: 'roaster' },
];

interface FilterSortBarProps {
  sortMode: SortMode;
  sortDir: SortDir;
  onSortChipPress: (key: SortMode) => void;
  filters: Filters;
  onClearFilter: (key: FilterKey) => void;
  onOpenFilterSheet: (key: FilterKey) => void;
}

function Pill({
  active,
  maxWidth,
  onPress,
  accessibilityLabel,
  children,
}: {
  active: boolean;
  maxWidth?: number;
  onPress: () => void;
  accessibilityLabel: string;
  children: (textStyle: TextStyle) => React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const activeProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(active ? 1 : 0, { duration: 180 });
  }, [active, activeProgress]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(activeProgress.value, [0, 1], ['transparent', colors.blossomPink]),
    borderColor: interpolateColor(activeProgress.value, [0, 1], [colors.supremeBeige, colors.blossomPink]),
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(activeProgress.value, [0, 1], [colors.black, '#ffffff']),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.95, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 180 });
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.pill, pillStyle, maxWidth ? { maxWidth } : null]}>
        {children(textStyle)}
      </Animated.View>
    </Pressable>
  );
}

export function FilterSortBar({
  sortMode,
  sortDir,
  onSortChipPress,
  filters,
  onClearFilter,
  onOpenFilterSheet,
}: FilterSortBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {SORT_CHIPS.map((chip) => {
        const active = sortMode === chip.key;
        const flipped =
          active &&
          ((chip.key === 'recent' && sortDir === 'asc') || (chip.key === 'az' && sortDir === 'desc'));
        return (
          <Pill
            key={chip.key}
            active={active}
            onPress={() => onSortChipPress(chip.key)}
            accessibilityLabel={`Sort by ${chip.label}`}
          >
            {(textStyle) => (
              <>
                <Animated.Text style={[styles.pillText, textStyle]}>{chip.label}</Animated.Text>
                <SortChevron
                  flipped={flipped}
                  color={active ? '#ffffff' : colors.black}
                  style={styles.sortChevron}
                />
              </>
            )}
          </Pill>
        );
      })}

      {FILTER_CHIPS.map((chip) => {
        const activeVals = filters[chip.key] || [];
        const hasFilter = activeVals.length > 0;
        const pillText = hasFilter ? activeVals.map((v) => v.toLowerCase()).join(', ') : chip.label;
        return (
          <Pill
            key={chip.key}
            active={hasFilter}
            maxWidth={hasFilter ? 200 : undefined}
            onPress={() => onOpenFilterSheet(chip.key)}
            accessibilityLabel={hasFilter ? `${chip.label}: ${pillText}` : `Filter by ${chip.label}`}
          >
            {(textStyle) => (
              <>
                <Animated.Text style={[styles.pillText, styles.pillTextFlex, textStyle]} numberOfLines={1}>
                  {pillText}
                </Animated.Text>
                {hasFilter && (
                  <Pressable
                    onPress={() => onClearFilter(chip.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Clear ${chip.label} filter`}
                    hitSlop={8}
                  >
                    <Animated.Text style={[styles.pillClear, textStyle]}>✕</Animated.Text>
                  </Pressable>
                )}
              </>
            )}
          </Pill>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  pill: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 15,
  },
  pillTextFlex: {
    flexShrink: 1,
  },
  pillClear: {
    fontSize: 12,
    opacity: 0.85,
  },
  sortChevron: {
    marginTop: -4,
  },
});
