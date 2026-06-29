import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Coffee, ORIGIN_FLAGS } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { Bag } from './Bag';
import { Card } from './Card';

interface Props {
  coffee: Coffee;
  /** When provided, the whole card becomes pressable. */
  onPress?: () => void;
  accessibilityLabel: string;
  /** Right-aligned content (e.g. a date label or a chevron). */
  trailing?: ReactNode;
}

/**
 * A bean shown as a horizontal card: bag thumbnail, bean name, roaster, and
 * origin/roast metadata, with optional trailing content. Shared by the Log
 * home shelf and the recipe picker.
 */
export function BeanCard({ coffee, onPress, accessibilityLabel, trailing }: Props) {
  const flag = coffee.origin ? ORIGIN_FLAGS[coffee.origin] ?? '' : '';
  const body = (
    <Card style={styles.beanCard}>
      <Bag coffee={coffee} width={60} height={60} beanNameOnly />
      <View style={styles.beanText}>
        <Text style={styles.beanName} numberOfLines={2}>
          {coffee.bean}
        </Text>
        <Text style={styles.roasterName} numberOfLines={1}>
          {coffee.roaster}
        </Text>
        {coffee.origin || coffee.roastLevel ? (
          <Text style={styles.origin} numberOfLines={1}>
            {coffee.origin ? `${flag ? `${flag} ` : ''}${coffee.origin}` : ''}
            {coffee.origin && coffee.roastLevel ? (
              <Text style={styles.originDot}>{'  •  '}</Text>
            ) : null}
            {coffee.roastLevel ?? ''}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Card>
  );

  if (!onPress) {
    return (
      <View accessibilityRole="summary" accessibilityLabel={accessibilityLabel}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  beanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  beanText: { flex: 1, minWidth: 0, gap: 3 },
  beanName: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 20,
    color: colors.black,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  // Roaster, country, and roast level share one style — Avenir 14/500,
  // grey-dark, line-height 17.
  roasterName: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    lineHeight: 17,
  },
  origin: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    lineHeight: 17,
  },
  // The separator bullet keeps its original smaller size so it doesn't
  // visually dominate the country/roast text.
  originDot: {
    fontSize: 10,
  },
});
