import React, { useMemo } from 'react';
import { ScrollView, View, Image, Text, StyleSheet, useWindowDimensions, SafeAreaView } from 'react-native';
import { sampleCoffees, Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { ShelfRow } from '../../src/components/ShelfRow';

const SHELF_DESIGN_WIDTH = 370;

// 8 bags in the opening shelf image
function ShelvesStart({ coffees, scale }: { coffees: Coffee[]; scale: number }) {
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
      <View style={{ position: 'absolute', left: Math.round(40 * scale), top: Math.round(37 * scale), width: Math.round(320 * scale), gap: Math.round(38 * scale) }}>
        <ShelfRow type="tall"   leftCoffee={c[0]} rightCoffee={c[1]} scale={scale} />
        <ShelfRow type="normal" leftCoffee={c[2]} rightCoffee={c[3]} scale={scale} />
        <ShelfRow type="open"   leftCoffee={c[4]} rightCoffee={c[5]} scale={scale} />
        <ShelfRow type="normal" leftCoffee={c[6]} rightCoffee={c[7]} scale={scale} />
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

// 6 bags per continuation shelf
function ShelfContinued({ coffees, scale }: { coffees: Coffee[]; scale: number }) {
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
      <View style={{ position: 'absolute', left: Math.round(36 * scale), top: Math.round(31 * scale), width: Math.round(320 * scale), gap: Math.round(38 * scale) }}>
        <ShelfRow type="normal" leftCoffee={c[0]} rightCoffee={c[1]} scale={scale} />
        <ShelfRow type="open"   leftCoffee={c[2]} rightCoffee={c[3]} scale={scale} />
        <ShelfRow type="normal" leftCoffee={c[4]} rightCoffee={c[5]} scale={scale} />
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

const FILTER_PILLS = ['All', 'Ethiopia', 'Colombia', 'Kenya', 'Natural', 'Washed'];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const scale = width / SHELF_DESIGN_WIDTH;
  const coffees = useMemo(() => sampleCoffees(), []);

  // First 8 go to ShelvesStart, then groups of 6 to ShelfContinued
  const startCoffees = coffees.slice(0, 8);
  const remaining = coffees.slice(8);
  const continuedGroups: Coffee[][] = [];
  for (let i = 0; i < remaining.length; i += 6) {
    continuedGroups.push(remaining.slice(i, i + 6));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter pill row */}
        <View style={[styles.pillRow, { paddingHorizontal: Math.round(16 * scale) }]}>
          {FILTER_PILLS.map((label) => (
            <View key={label} style={[styles.pill, label === 'All' && styles.pillActive]}>
              <Text style={[styles.pillText, label === 'All' && styles.pillTextActive]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Shelves */}
        <ShelvesStart coffees={startCoffees} scale={scale} />
        {continuedGroups.map((group, i) => (
          <ShelfContinued key={i} coffees={group} scale={scale} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  scroll: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
    width: '100%',
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
});
