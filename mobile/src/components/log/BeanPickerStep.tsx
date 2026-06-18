import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { Bag } from '../Bag';
import { Card } from '../Card';
import { SearchIcon } from '../SearchIcon';
import { TAB_BAR_HEIGHT } from '../TabBar';

interface Props {
  coffees: Coffee[];
  bottomInset: number;
  onSelectCoffee: (coffee: Coffee) => void;
}

export function BeanPickerStep({ coffees, bottomInset, onSelectCoffee }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coffees;
    return coffees.filter(
      (c) =>
        c.bean.toLowerCase().includes(q) ||
        c.roaster.toLowerCase().includes(q) ||
        (c.origin?.toLowerCase().includes(q) ?? false),
    );
  }, [coffees, query]);

  const scrollBottomPad = Math.max(bottomInset, 16) + TAB_BAR_HEIGHT + 24;

  return (
    <View style={styles.step}>
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={colors.greyDark} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search your cupboard"
            placeholderTextColor={colors.greyDark}
            accessibilityLabel="Search coffees"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={styles.clearButton}
            >
              <Text style={styles.clearGlyph}>×</Text>
            </Pressable>
          )}
        </View>

        {filtered.length === 0 ? (
          <Text style={styles.empty}>
            {query.trim() ? 'No coffees match that search.' : 'No coffees in your cupboard yet.'}
          </Text>
        ) : (
          filtered.map((coffee) => (
            <Pressable
              key={coffee.id}
              onPress={() => onSelectCoffee(coffee)}
              accessibilityRole="button"
              accessibilityLabel={`Brew ${coffee.bean} from ${coffee.roaster}`}
            >
              <Card style={styles.beanCard}>
                <Bag coffee={coffee} width={64} height={64} beanNameOnly />
                <View style={styles.beanText}>
                  <Text style={styles.beanName} numberOfLines={2}>{coffee.bean}</Text>
                  <Text style={styles.roasterName} numberOfLines={1}>{coffee.roaster}</Text>
                  <Text style={styles.brewCount}>
                    {coffee.brews.length === 0
                      ? 'No recipes yet'
                      : `${coffee.brews.length} recipe${coffee.brews.length === 1 ? '' : 's'} logged`}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    padding: 0,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  clearGlyph: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.greyDark,
  },
  list: { paddingHorizontal: 24, gap: 12 },
  beanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  beanText: { flex: 1, minWidth: 0 },
  beanName: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 20,
    color: colors.black,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  roasterName: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 12,
    color: colors.greyDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  brewCount: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.moss,
    marginTop: 6,
  },
  empty: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    textAlign: 'center',
    paddingVertical: 24,
    lineHeight: 20,
  },
});
