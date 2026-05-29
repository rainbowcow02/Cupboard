import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Brew, Coffee, formatDate } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { BagLabel } from '../../src/components/BagLabel';
import { BrewCard } from '../../src/components/BrewCard';
import { GlassCard } from '../../src/components/GlassCard';
import { useCoffees } from '../../src/hooks/useCoffees';
import { BrewForm } from './BrewForm';

const ORIGIN_FLAGS: Record<string, string> = {
  Ethiopia: '🇪🇹', Colombia: '🇨🇴', Panama: '🇵🇦', Peru: '🇵🇪',
  Guatemala: '🇬🇹', Kenya: '🇰🇪', Brazil: '🇧🇷', 'Costa Rica': '🇨🇷',
  Bolivia: '🇧🇴', Honduras: '🇭🇳', Rwanda: '🇷🇼', Yemen: '🇾🇪',
};

const BAG_IMAGES: Record<string, ReturnType<typeof require>> = {
  white: require('../../../shared/assets/bag-white.png'),
  blue: require('../../../shared/assets/bag-blue.png'),
  green: require('../../../shared/assets/bag-green.png'),
  orange: require('../../../shared/assets/bag-orange.png'),
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coffees, refresh } = useCoffees();
  const [addingBrew, setAddingBrew] = useState(false);
  const [editingBrew, setEditingBrew] = useState<Brew | null>(null);

  const coffee = coffees.find((c) => c.id === id) as Coffee | undefined;

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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Svg width={14} height={22} viewBox="0 0 14 22" fill="none">
          <Path d="M12 2L3 11L12 20" stroke={colors.burgundy} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Bag hero */}
        <View style={styles.hero}>
          <View style={{ position: 'relative', width: 260, height: 260 }}>
            <Image
              source={BAG_IMAGES[coffee.bagImg] ?? BAG_IMAGES.white}
              style={styles.bagImage}
              resizeMode="contain"
            />
            <BagLabel coffee={coffee} bagWidth={260} />
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
          <GlassCard>
            <DetailRow label="Roast" value={coffee.roastLevel} />
            <DetailRow label="Process" value={coffee.process} />
            <DetailRow label="Variety" value={coffee.variety} last />
          </GlassCard>

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
            <GlassCard>
              <DetailRow label="Country" value={`${flag} ${coffee.origin ?? ''}`} />
              <DetailRow label="Region" value={coffee.region} last={!coffee.altitude} />
              {coffee.altitude && <DetailRow label="Altitude" value={coffee.altitude} last />}
            </GlassCard>
          </View>

          {/* Brew recipes */}
          <View style={styles.section}>
            <SectionHeader title="Brew recipes" action="+ Add" onAction={() => setAddingBrew(true)} />
            {brews.length === 0 ? (
              <GlassCard>
                <Text style={styles.emptyBrews}>No brew recipes yet. Tap "+ Add" to log one.</Text>
              </GlassCard>
            ) : (
              <View style={styles.brewList}>
                {brews.map((b, i) => (
                  <BrewCard
                    key={b.id ?? i}
                    brew={b}
                    onPress={b.id ? () => setEditingBrew(b) : undefined}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {(addingBrew || editingBrew) && coffee && (
        <BrewForm coffee={coffee} brew={editingBrew} onClose={onBrewClose} onSaved={onBrewSaved} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.pearl },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 52 },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 8,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bagImage: { width: 260, height: 260 },
  titleBlock: { paddingHorizontal: 24, paddingBottom: 16, gap: 4 },
  roaster: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 15, color: colors.moss, lineHeight: 20 },
  bean: { fontFamily: fonts.condensed, fontWeight: '600', fontSize: 42, color: '#000', lineHeight: 46, letterSpacing: -0.5 },
  sections: { paddingHorizontal: 24, gap: 32 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 22, color: '#000', lineHeight: 30 },
  sectionAction: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 12, color: colors.burgundy },
  detailRowOuter: { paddingHorizontal: 24, paddingTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingBottom: 16 },
  detailLabel: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13, color: colors.greyDark, flexShrink: 0 },
  detailValue: { fontFamily: fonts.sans, fontWeight: '400', fontSize: 15, color: colors.greyDark, textAlign: 'right', lineHeight: 22, flex: 1 },
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
