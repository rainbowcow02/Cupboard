import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Coffee, BagImg } from '@shared/lib/coffees';
import { BagLabel } from './BagLabel';

// Full-resolution bags (600×1234) for the large detail hero.
const BAG_IMAGES: Record<BagImg, ReturnType<typeof require>> = {
  white: require('../../../shared/assets/bag-white-lrg.png'),
  blue: require('../../../shared/assets/bag-blue-lrg.png'),
  green: require('../../../shared/assets/bag-green-lrg.png'),
  orange: require('../../../shared/assets/bag-orange-lrg.png'),
};

// Downscaled bags (270px wide) — ~6x fewer pixels to decode, used for the
// small shelf/card thumbnails where the full-res source is overkill.
const BAG_IMAGES_SM: Record<BagImg, ReturnType<typeof require>> = {
  white: require('../../../shared/assets/bag-white-sm.png'),
  blue: require('../../../shared/assets/bag-blue-sm.png'),
  green: require('../../../shared/assets/bag-green-sm.png'),
  orange: require('../../../shared/assets/bag-orange-sm.png'),
};

// Above this rendered width the small variant would look soft, so fall back to
// the full-res source. Every Bag use today (shelf ~88, cards 60–72) is below it.
const SM_VARIANT_MAX_WIDTH = 140;

interface BagProps {
  coffee: Coffee;
  width: number;
  height: number;
  onPress?: () => void;
  beanNameOnly?: boolean;
}

export function Bag({ coffee, width, height, onPress, beanNameOnly = false }: BagProps) {
  const useSmall = width <= SM_VARIANT_MAX_WIDTH;
  const source = (useSmall ? BAG_IMAGES_SM : BAG_IMAGES)[coffee.bagImg];
  const content = (
    <View style={{ width, height, position: 'relative' }}>
      <Image
        source={source}
        style={styles.image}
        contentFit="contain"
        cachePolicy="memory-disk"
        recyclingKey={`${coffee.bagImg}-${useSmall ? 'sm' : 'lg'}`}
      />
      <BagLabel coffee={coffee} bagWidth={width} beanNameOnly={beanNameOnly} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
