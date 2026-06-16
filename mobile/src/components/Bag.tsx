import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Coffee, BagImg } from '@shared/lib/coffees';
import { BagLabel } from './BagLabel';

const BAG_IMAGES: Record<BagImg, ReturnType<typeof require>> = {
  white: require('../../../shared/assets/bag-white.png'),
  blue: require('../../../shared/assets/bag-blue.png'),
  green: require('../../../shared/assets/bag-green.png'),
  orange: require('../../../shared/assets/bag-orange.png'),
};

interface BagProps {
  coffee: Coffee;
  width: number;
  height: number;
  onPress?: () => void;
  beanNameOnly?: boolean;
}

export function Bag({ coffee, width, height, onPress, beanNameOnly = false }: BagProps) {
  const content = (
    <View style={{ width, height, position: 'relative' }}>
      <Image
        source={BAG_IMAGES[coffee.bagImg]}
        style={styles.image}
        resizeMode="contain"
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
