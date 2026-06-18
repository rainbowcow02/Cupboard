import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, formatDate } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { Bag } from '../../src/components/Bag';
import { TAB_BAR_HEIGHT } from '../../src/components/TabBar';
import { useCoffees } from '../../src/hooks/useCoffees';

const ORIGIN_FLAGS: Record<string, string> = {
  Ethiopia: '🇪🇹',
  Colombia: '🇨🇴',
  Panama: '🇵🇦',
  Peru: '🇵🇪',
  Guatemala: '🇬🇹',
  Kenya: '🇰🇪',
  Brazil: '🇧🇷',
  'Costa Rica': '🇨🇷',
  Bolivia: '🇧🇴',
  Honduras: '🇭🇳',
  Rwanda: '🇷🇼',
  Yemen: '🇾🇪',
};

function groupByOrigin(coffees: Coffee[]): [string, Coffee[]][] {
  const groups = new Map<string, Coffee[]>();
  for (const coffee of coffees) {
    const origin = coffee.origin?.trim() || 'Unknown';
    const list = groups.get(origin);
    if (list) {
      list.push(coffee);
    } else {
      groups.set(origin, [coffee]);
    }
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function ExploreScreen() {
  const { coffees } = useCoffees();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const grouped = useMemo(() => groupByOrigin(coffees), [coffees]);
  const scrollBottomPad = Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 24;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Explore</Text>
        <Text style={styles.subtitleText}>
          Map preview unavailable on web — browse by origin below
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
      >
        {grouped.map(([origin, originCoffees]) => (
          <View key={origin} style={styles.originSection}>
            <Text style={styles.originHeader}>
              {ORIGIN_FLAGS[origin] ?? ''} {origin}
            </Text>
            {originCoffees.map((coffee, index) => (
              <View key={coffee.id}>
                <Pressable
                  style={styles.listItem}
                  onPress={() => router.push(`/coffee/${coffee.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${coffee.bean} by ${coffee.roaster}`}
                >
                  <View style={styles.bagThumb}>
                    <Bag coffee={coffee} width={72} height={72} beanNameOnly />
                  </View>
                  <View style={styles.listItemText}>
                    <Text style={styles.beanName} numberOfLines={1}>
                      {coffee.bean}
                    </Text>
                    <Text style={styles.roasterName} numberOfLines={1}>
                      {coffee.roaster}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(coffee.date)}</Text>
                </Pressable>
                {index < originCoffees.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleText: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.black,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitleText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  originSection: {
    marginBottom: 20,
    borderRadius: 34,
    backgroundColor: 'rgba(245,245,245,0.92)',
    overflow: 'hidden',
  },
  originHeader: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.black,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    lineHeight: 26,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 4,
    paddingRight: 24,
  },
  bagThumb: {
    width: 72,
    height: 72,
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  beanName: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 15,
    color: colors.black,
  },
  roasterName: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
  },
  dateText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 12,
    color: colors.greyDark,
    marginLeft: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginLeft: 88,
    marginRight: 24,
  },
});
