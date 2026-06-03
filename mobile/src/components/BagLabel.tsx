import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Coffee } from '@shared/lib/coffees';
import { fonts } from '@shared/theme';

const ORIGIN_FLAGS: Record<string, string> = {
  'Ethiopia': '🇪🇹',
  'Colombia': '🇨🇴',
  'Panama': '🇵🇦',
  'Peru': '🇵🇪',
  'Guatemala': '🇬🇹',
  'Kenya': '🇰🇪',
  'Brazil': '🇧🇷',
  'Costa Rica': '🇨🇷',
  'Bolivia': '🇧🇴',
  'Honduras': '🇭🇳',
  'Rwanda': '🇷🇼',
  'Yemen': '🇾🇪',
};

interface BagLabelProps {
  coffee: Coffee;
  bagWidth: number;
}

export function BagLabel({ coffee, bagWidth }: BagLabelProps) {
  const lightBag = coffee.bagImg === 'white';
  const inkColor = lightBag ? '#000000' : '#f9eddd';
  const subColor = lightBag ? '#6b6b6b' : 'rgba(249,237,221,0.7)';
  const dividerColor = lightBag ? 'rgba(0,0,0,0.4)' : 'rgba(249,237,221,0.4)';

  const scale = bagWidth / 300;
  // Below 80px (explore thumbnails) use lower minimums so text scales down
  // rather than overflowing a narrow bag.
  const small = bagWidth < 80;
  const labelWidth  = small ? Math.round(115 * scale)   : Math.max(70, Math.round(115 * scale));
  const beanFontSize = small ? Math.max(8, Math.round(24 * scale)) : Math.max(16, Math.round(24 * scale));
  const subFontSize  = small ? Math.max(5, Math.round(9 * scale))  : Math.max(7,  Math.round(9 * scale));
  const dividerMy    = small ? Math.max(2, Math.round(12 * scale)) : Math.max(4,  Math.round(12 * scale));

  const flag = coffee.origin ? (ORIGIN_FLAGS[coffee.origin] || '') : '';

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={{ width: labelWidth, alignItems: 'center' }}>
        <Text
          style={[styles.beanName, { fontSize: beanFontSize, lineHeight: Math.round(beanFontSize * 1.2), color: inkColor }]}
          numberOfLines={3}
        >
          {coffee.bean}
        </Text>
        <Text
          style={[styles.roaster, { fontSize: subFontSize, color: subColor }]}
          numberOfLines={2}
        >
          {coffee.roaster}
        </Text>
        <View style={[styles.divider, { backgroundColor: dividerColor, marginVertical: dividerMy }]} />
        <Text style={[styles.origin, { fontSize: subFontSize, color: subColor }]} numberOfLines={1}>
          {flag ? `${flag} ` : ''}{coffee.origin}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '24%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  beanName: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.9,
  },
  roaster: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  divider: {
    width: 18,
    height: 1,
  },
  origin: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
