import React, { useState } from 'react';
import { View, Text, StyleSheet, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';
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

const BEAN_MAX_LINES = 4;
// A roaster wrapping to this many lines is what tips the block past the bag face.
const ROASTER_LIFT_MIN_LINES = 3;

interface BagLabelProps {
  coffee: Coffee;
  bagWidth: number;
  beanNameOnly?: boolean;
}

type LineCounts = { key: string; bean: number; roaster: number };

// Line counts are tagged with the coffee they were measured from: when a slot is
// reused for a different bean the stale counts are dropped rather than briefly
// applying the previous bean's offset.
function withLineCount(prev: LineCounts, key: string, field: 'bean' | 'roaster', count: number): LineCounts {
  const base = prev.key === key ? prev : { key, bean: 0, roaster: 0 };
  return base[field] === count ? base : { ...base, [field]: count };
}

export function BagLabel({ coffee, bagWidth, beanNameOnly = false }: BagLabelProps) {
  const lightBag = coffee.bagImg === 'white';
  const inkColor = lightBag ? '#000000' : '#f9eddd';
  const subColor = lightBag ? '#6b6b6b' : 'rgba(249,237,221,0.7)';
  const dividerColor = lightBag ? 'rgba(0,0,0,0.4)' : 'rgba(249,237,221,0.4)';

  const scale = bagWidth / 300;
  // Below 80px (explore thumbnails) use lower minimums so text scales down
  // rather than overflowing a narrow bag.
  const small = bagWidth < 80;
  // Non-small floors mirror web's BagLabel (web/src/App.jsx): at the ~89px home
  // bag these resolve to a 70px label box at 16px, which is what keeps a long
  // single word ("Watermelon", "Monteblanco") on one line instead of breaking
  // mid-word. Keep them in step with web.
  const labelWidth  = small ? Math.round(115 * scale)   : Math.max(70, Math.round(115 * scale));
  const beanFontSize = small
    ? Math.max(8, Math.round(24 * scale))
    : Math.max(16, Math.round(24 * scale));
  const subFontSize  = small ? Math.max(5, Math.round(9 * scale))  : Math.max(7,  Math.round(9 * scale));
  const dividerMy    = small ? Math.max(2, Math.round(12 * scale)) : Math.max(4,  Math.round(12 * scale));

  const flag = coffee.origin ? (ORIGIN_FLAGS[coffee.origin] || '') : '';

  const [lineCounts, setLineCounts] = useState<LineCounts>({ key: coffee.id, bean: 0, roaster: 0 });
  const handleBeanTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = e.nativeEvent?.lines;
    if (!lines) return;
    setLineCounts((prev) => withLineCount(prev, coffee.id, 'bean', lines.length));
  };
  const handleRoasterTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = e.nativeEvent?.lines;
    if (!lines) return;
    setLineCounts((prev) => withLineCount(prev, coffee.id, 'roaster', lines.length));
  };

  // Exception: a bean name at its full line clamp plus a roaster wrapping to three
  // lines runs the divider and origin off the bag face, so the block sits higher.
  // beanNameOnly bags never render a roaster, so this can only fire on full labels.
  const longText =
    lineCounts.key === coffee.id &&
    lineCounts.bean >= BEAN_MAX_LINES &&
    lineCounts.roaster >= ROASTER_LIFT_MIN_LINES;

  return (
    <View style={[styles.container, longText && styles.containerLongText]} pointerEvents="none">
      <View style={{ width: labelWidth, alignItems: 'center' }}>
        <Text
          style={[styles.beanName, { fontSize: beanFontSize, lineHeight: Math.round(beanFontSize * 1.2), color: inkColor }]}
          numberOfLines={BEAN_MAX_LINES}
          onTextLayout={handleBeanTextLayout}
        >
          {coffee.bean}
        </Text>
        {!beanNameOnly && (
          <>
            <Text
              style={[styles.roaster, { fontSize: subFontSize, color: subColor }]}
              onTextLayout={handleRoasterTextLayout}
            >
              {coffee.roaster}
            </Text>
            <View style={[styles.divider, { backgroundColor: dividerColor, marginVertical: dividerMy }]} />
            <Text style={[styles.origin, { fontSize: subFontSize, color: subColor }]} numberOfLines={1}>
              {flag ? `${flag} ` : ''}{coffee.origin}
            </Text>
          </>
        )}
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
  // 24px higher on the 181pt-tall shelf bag (24 / 181 ≈ 13.25%), expressed as a
  // percentage so the lift stays proportional at every bag size.
  containerLongText: {
    top: '10.75%',
  },
  beanName: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.9,
    // Negative letterSpacing makes RN measure the centered text box narrower
    // than what's actually painted, so it renders drifted right of true
    // center. This is a pure paint-time nudge back to center — it doesn't
    // touch layout/measurement, so wrapping and the longText line-count
    // logic above are unaffected.
    transform: [{ translateX: -1.5 }],
  },
  roaster: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginTop: 8,
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
