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
            {coffee.origin && coffee.roastLevel ? '  •  ' : ''}
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
  // Roaster, country, and roast level share one style — Avenir Roman 15/400,
  // grey-dark, line-height 1.5 (see Figma list-item design).
  roasterName: {
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 15,
    color: colors.greyDark,
    lineHeight: 22,
  },
  origin: {
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 15,
    color: colors.greyDark,
    lineHeight: 22,
  },
});
