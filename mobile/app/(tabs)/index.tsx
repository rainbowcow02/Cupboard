import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { ShelfRow } from '../../src/components/ShelfRow';
import { TAB_BAR_HEIGHT } from '../../src/components/TabBar';
import { useCoffees } from '../../src/hooks/useCoffees';

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
          left: Math.round(40 * scale),
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
          left: Math.round(36 * scale),
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
  const [activeFilter, setActiveFilter] = useState('All');

  const origins = useMemo(() => {
    const seen = new Set<string>();
    for (const c of coffees) if (c.origin) seen.add(c.origin);
    return Array.from(seen).slice(0, 5);
  }, [coffees]);

  const filterPills = useMemo(() => ['All', ...origins], [origins]);

  const filtered = useMemo(
    () =>
      activeFilter === 'All'
        ? coffees
        : coffees.filter((c) => c.origin === activeFilter),
    [coffees, activeFilter],
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cupboard</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>L</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter pill row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillRow, { paddingHorizontal: Math.round(16 * scale) }]}
        >
          {filterPills.map((label) => {
            const active = label === activeFilter;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setActiveFilter(label)}
                style={[styles.pill, active && styles.pillActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: 38,
    color: colors.black,
    letterSpacing: -1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 20,
    color: colors.pearl,
  },
  scroll: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.supremeBeige,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.moss,
    borderColor: colors.moss,
  },
  pillText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.moss,
    letterSpacing: 0.3,
  },
  pillTextActive: {
    color: colors.pearl,
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
