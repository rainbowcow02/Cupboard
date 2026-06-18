import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { FilterSheet } from '../../src/components/FilterSheet';
import { FilterSortBar } from '../../src/components/FilterSortBar';
import { PageHeader } from '../../src/components/PageHeader';
import { ShelfRow } from '../../src/components/ShelfRow';
import { BottomChromeScrim } from '../../src/components/surfaces/BottomChromeScrim';
import { TAB_BAR_HEIGHT } from '../../src/components/TabBar';
import { useCoffees } from '../../src/hooks/useCoffees';
import { EMPTY_FILTERS, FilterKey, sortAndFilterCoffees, SortDir, SortMode } from '../../src/lib/coffeeFilters';

const SHELF_DESIGN_WIDTH = 370;

function ShelvesStart({
  coffees,
  scale,
  onPressCoffee,
}: {
  coffees: (Coffee | null)[];
  scale: number;
  onPressCoffee: (id: string) => void;
}) {
  const c = [...coffees, ...Array(8).fill(null)].slice(0, 8) as (Coffee | null)[];
  const shelfW = Math.round(SHELF_DESIGN_WIDTH * scale);
  const shelfH = Math.round(998 * scale);

  return (
    <View style={{ width: shelfW, height: shelfH }}>
      <Image
        source={require('../../../shared/assets/shelf-v2-whole.png')}
        style={[StyleSheet.absoluteFill, { width: shelfW, height: shelfH }]}
        resizeMode="cover"
      />
      <View
        style={{
          position: 'absolute',
          left: Math.round(28 * scale),
          top: Math.round(37 * scale),
          width: Math.round(320 * scale),
          gap: Math.round(38 * scale),
        }}
      >
        <ShelfRow type="tall"   leftCoffee={c[0]} rightCoffee={c[1]} scale={scale} onPressCoffee={onPressCoffee} />
        <ShelfRow type="normal" leftCoffee={c[2]} rightCoffee={c[3]} scale={scale} onPressCoffee={onPressCoffee} />
        <ShelfRow type="open"   leftCoffee={c[4]} rightCoffee={c[5]} scale={scale} onPressCoffee={onPressCoffee} />
        <ShelfRow type="normal" leftCoffee={c[6]} rightCoffee={c[7]} scale={scale} onPressCoffee={onPressCoffee} />
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={require('../../../shared/assets/shelf-v2-frame.png')}
          style={{ width: shelfW, height: shelfH }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

function ShelfContinued({
  coffees,
  scale,
  onPressCoffee,
}: {
  coffees: (Coffee | null)[];
  scale: number;
  onPressCoffee: (id: string) => void;
}) {
  const c = [...coffees, ...Array(6).fill(null)].slice(0, 6) as (Coffee | null)[];
  const shelfW = Math.round(SHELF_DESIGN_WIDTH * scale);
  const shelfH = Math.round(733 * scale);

  return (
    <View style={{ width: shelfW, height: shelfH }}>
      <Image
        source={require('../../../shared/assets/shelfcontinue-v2-whole.png')}
        style={[StyleSheet.absoluteFill, { width: shelfW, height: shelfH }]}
        resizeMode="cover"
      />
      <View
        style={{
          position: 'absolute',
          left: Math.round(27 * scale),
          top: Math.round(31 * scale),
          width: Math.round(320 * scale),
          gap: Math.round(38 * scale),
        }}
      >
        <ShelfRow type="normal" leftCoffee={c[0]} rightCoffee={c[1]} scale={scale} onPressCoffee={onPressCoffee} />
        <ShelfRow type="open"   leftCoffee={c[2]} rightCoffee={c[3]} scale={scale} onPressCoffee={onPressCoffee} />
        <ShelfRow type="normal" leftCoffee={c[4]} rightCoffee={c[5]} scale={scale} onPressCoffee={onPressCoffee} />
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={require('../../../shared/assets/shelfcontinue-v2-frame.png')}
          style={{ width: shelfW, height: shelfH }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = (width - 32) / SHELF_DESIGN_WIDTH;
  const router = useRouter();
  const { coffees, loading } = useCoffees();
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterSheetKey, setFilterSheetKey] = useState<FilterKey | null>(null);

  const handleSortChipPress = useCallback((key: SortMode) => {
    if (sortMode === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortMode(key);
      setSortDir(key === 'recent' ? 'desc' : 'asc');
    }
  }, [sortMode]);

  const handleClearFilter = useCallback((key: FilterKey) => {
    setFilters((prev) => ({ ...prev, [key]: [] }));
  }, []);

  const filtered = useMemo(
    () => sortAndFilterCoffees(coffees, sortMode, sortDir, filters),
    [coffees, sortMode, sortDir, filters],
  );

  const onPressCoffee = useCallback(
    (id: string) => router.push(`/coffee/${encodeURIComponent(id)}`),
    [router],
  );

  const startCoffees = filtered.slice(0, 8);
  const remaining = filtered.slice(8);
  const continuedGroups: Coffee[][] = [];
  for (let i = 0; i < remaining.length; i += 6) {
    continuedGroups.push(remaining.slice(i, i + 6));
  }

  return (
    <SafeAreaView style={styles.container}>
      <BottomChromeScrim />
      <PageHeader
        title="Cupboard"
        avatarInitial="L"
        stickyContent={
          <FilterSortBar
            sortMode={sortMode}
            sortDir={sortDir}
            onSortChipPress={handleSortChipPress}
            filters={filters}
            onClearFilter={handleClearFilter}
            onOpenFilterSheet={setFilterSheetKey}
          />
        }
        scrollViewProps={{
          contentContainerStyle: { alignItems: 'center', paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
          showsVerticalScrollIndicator: false,
        }}
      >
        {/* Loading indicator on top of sample data */}
        {loading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color={colors.moss} />
            <Text style={styles.loadingText}>Loading your cupboard…</Text>
          </View>
        )}

        {/* Shelves */}
        <ShelvesStart coffees={startCoffees} scale={scale} onPressCoffee={onPressCoffee} />
        {continuedGroups.map((group, i) => (
          <ShelfContinued key={i} coffees={group} scale={scale} onPressCoffee={onPressCoffee} />
        ))}
      </PageHeader>
      <FilterSheet
        filterKey={filterSheetKey}
        coffees={coffees}
        activeValues={filterSheetKey ? filters[filterSheetKey] : []}
        onSelect={(values) => {
          if (filterSheetKey) setFilters((prev) => ({ ...prev, [filterSheetKey]: values }));
        }}
        onClose={() => setFilterSheetKey(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(53,92,68,0.08)',
    borderRadius: 20,
    marginBottom: 8,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 12,
    color: colors.moss,
  },
});
