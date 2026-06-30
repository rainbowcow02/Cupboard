import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brew, Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { GlassBackButton } from '../../src/components/GlassBackButton';
import { BagLabel } from '../../src/components/BagLabel';
import { BrewCard } from '../../src/components/BrewCard';
import { Card } from '../../src/components/Card';
import { OriginMap } from '../../src/components/OriginMap';
import { useCoffees } from '../../src/hooks/useCoffees';
import { BrewSummary } from '../../src/components/BrewSummary';
import { BrewForm } from './BrewForm';

const ORIGIN_FLAGS: Record<string, string> = {
  Ethiopia: '🇪🇹', Colombia: '🇨🇴', Panama: '🇵🇦', Peru: '🇵🇪',
  Guatemala: '🇬🇹', Kenya: '🇰🇪', Brazil: '🇧🇷', 'Costa Rica': '🇨🇷',
  Bolivia: '🇧🇴', Honduras: '🇭🇳', Rwanda: '🇷🇼', Yemen: '🇾🇪',
};

const BAG_IMAGES: Record<string, ReturnType<typeof require>> = {
  white: require('../../../shared/assets/bag-white-lrg.png'),
  blue: require('../../../shared/assets/bag-blue-lrg.png'),
  green: require('../../../shared/assets/bag-green-lrg.png'),
  orange: require('../../../shared/assets/bag-orange-lrg.png'),
};

function DetailRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  return (
    <View style={styles.detailRowOuter}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
      {!last && <View style={styles.divider} />}
    </View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function CoffeeDetailScreen() {
  const { beanId, draft } = useLocalSearchParams<{ beanId: string; draft?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coffees, refresh } = useCoffees();
  const [addingBrew, setAddingBrew] = useState(false);
  const [editingBrew, setEditingBrew] = useState<Brew | null>(null);
  // Synchronous scroll channel so BrewCard can keep the expand button anchored on collapse.
  const scrollViewRef = useRef<Animated.ScrollView | null>(null);
  const scrollYRef = useRef(0);
  // Drives the frosted circle behind the back button as the hero scrolls away.
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const captureScrollPosition = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y;
      scrollY.setValue(e.nativeEvent.contentOffset.y);
    },
    [scrollY],
  );

  const scrollToY = useCallback((y: number) => {
    const next = Math.max(0, y);
    scrollYRef.current = next;
    scrollViewRef.current?.scrollTo({ y: next, animated: false });
  }, []);

  const getCurrentScrollY = useCallback(() => scrollYRef.current, []);

  // A persisted bean is the source of truth; fall back to a draft passed through
  // navigation for a bean just entered in the Log flow that has no saved cups yet.
  const stored = coffees.find((c) => c.id === beanId) as Coffee | undefined;
  const draftCoffee = useMemo<Coffee | undefined>(() => {
    if (!draft) return undefined;
    try {
      return JSON.parse(draft) as Coffee;
    } catch {
      return undefined;
    }
  }, [draft]);
  const coffee = stored ?? draftCoffee;

  const onBrewClose = useCallback(() => {
    setAddingBrew(false);
    setEditingBrew(null);
  }, []);

  const onBrewSaved = useCallback(async () => {
    await refresh();
    onBrewClose();
  }, [refresh, onBrewClose]);

  if (!coffee) {
    return (
      <View style={[styles.notFound, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.notFoundText}>Coffee not found.</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const tastingNotes = (coffee.notes || '').split(',').map((n) => n.trim()).filter(Boolean);
  const brews = coffee.brews || [];
  const flag = ORIGIN_FLAGS[coffee.origin ?? ''] ?? '';

  return (
    <View style={styles.screen}>
      {/* Back button — frosted circle fades in as the hero scrolls away */}
      <GlassBackButton
        onPress={() => router.back()}
        scrollY={scrollY}
        fadeStart={220}
        fadeEnd={300}
        style={[styles.backBtn, { top: 16 }]}
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={captureScrollPosition}
      >
        {/* Bag hero */}
        <View style={styles.hero}>
          <View style={styles.heroBagWrap}>
            <Image
              source={BAG_IMAGES[coffee.bagImg] ?? BAG_IMAGES.white}
              style={styles.bagImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              recyclingKey={`${coffee.bagImg}-hero`}
            />
            <BagLabel coffee={coffee} bagWidth={300} />
          </View>
        </View>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.roaster}>{coffee.roaster}</Text>
          <Text style={styles.bean}>{coffee.bean}</Text>
        </View>

        {/* Sections */}
        <View style={styles.sections}>
          {/* Details glass card */}
          <Card>
            <DetailRow label="Roast" value={coffee.roastLevel} />
            <DetailRow label="Process" value={coffee.process} />
            <DetailRow label="Variety" value={coffee.variety} last />
          </Card>

          {/* Tasting notes chips */}
          {tastingNotes.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Tasting notes" />
              <View style={styles.chipsRow}>
                {tastingNotes.map((n) => (
                  <View key={n} style={styles.chip}>
                    <Text style={styles.chipText}>{n}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Origin */}
          <View style={styles.section}>
            <SectionHeader title="Origin" />
            <Card>
              <DetailRow label="Country" value={`${flag} ${coffee.origin ?? ''}`} />
              <DetailRow label="Region" value={coffee.region} last={!coffee.altitude} />
              {coffee.altitude && <DetailRow label="Altitude" value={coffee.altitude} last />}
              {coffee.origin && (
                <View style={styles.originMapWrap}>
                  <OriginMap country={coffee.origin} />
                </View>
              )}
            </Card>
          </View>

          {/* Brew recipes */}
          <View style={styles.section}>
            <SectionHeader title="Brew recipes" action="+ Add" onAction={() => setAddingBrew(true)} />
            {brews.length > 0 && <BrewSummary brews={brews} />}
            <View style={styles.brewList}>
              {brews.length === 0 ? (
                <Card>
                  <Text style={styles.emptyBrews}>{'No brew recipes yet. Tap "+ Add" to log one.'}</Text>
                </Card>
              ) : (
                brews.map((b, i) => (
                  <BrewCard
                    key={b.id ?? i}
                    brew={b}
                    getCurrentScrollY={getCurrentScrollY}
                    scrollToY={scrollToY}
                    onEdit={b.id ? () => setEditingBrew(b) : undefined}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {(addingBrew || editingBrew) && coffee && (
        <BrewForm coffee={coffee} brew={editingBrew} onClose={onBrewClose} onSaved={onBrewSaved} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.pearl },
  scroll: { flex: 1 },
  scrollContent: {},
  backBtn: {
    position: 'absolute',
    left: 8,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  heroBagWrap: {
    position: 'relative',
    width: 300,
    height: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 13,
    elevation: 12,
  },
  bagImage: { width: 300, height: 300 },
  titleBlock: { paddingHorizontal: 24, paddingVertical: 16, gap: 16 },
  roaster: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 15, color: colors.moss, lineHeight: 17 },
  bean: { fontFamily: fonts.condensed, fontWeight: '600', fontSize: 48, color: colors.black, lineHeight: 54, letterSpacing: -0.5 },
  sections: { paddingHorizontal: 24, gap: 36 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.black, lineHeight: 30 },
  sectionAction: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 12, color: colors.burgundy },
  originMapWrap: { paddingHorizontal: 24, paddingBottom: 24 },
  detailRowOuter: { paddingHorizontal: 24, paddingTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingBottom: 16 },
  detailLabel: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.greyDark, flexShrink: 0 },
  detailValue: { fontFamily: fonts.sans, fontWeight: '400', fontSize: 15, color: colors.black, textAlign: 'right', lineHeight: 22, flex: 1 },
  divider: { height: 0.5, backgroundColor: '#E7E7E7' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(252,153,155,0.22)' },
  chipText: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.burgundy },
  emptyBrews: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.greyDark, textAlign: 'center', padding: 24, lineHeight: 20 },
  brewList: { gap: 12 },
  notFound: { flex: 1, backgroundColor: colors.pearl, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontFamily: fonts.sans, fontSize: 16, color: colors.greyDark },
  backLink: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 15, color: colors.burgundy },
});
