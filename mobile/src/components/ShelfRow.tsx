import React from 'react';
import { View } from 'react-native';
import { Coffee } from '@shared/lib/coffees';
import { Bag } from './Bag';

type RowType = 'tall' | 'normal' | 'open';

interface ShelfRowProps {
  type: RowType;
  leftCoffee?: Coffee | null;
  rightCoffee?: Coffee | null;
  scale: number;
  onPressCoffee?: (id: string) => void;
}

// All dimensions are the original 370px-wide design values, scaled uniformly.
export function ShelfRow({ type, leftCoffee, rightCoffee, scale, onPressCoffee }: ShelfRowProps) {
  const s = (n: number) => Math.round(n * scale);

  if (type === 'tall') {
    return (
      <View style={{ flexDirection: 'row', gap: s(32), alignItems: 'center' }}>
        <View style={{ width: s(143), height: s(224), position: 'relative' }}>
          {leftCoffee && (
            <View style={{ position: 'absolute', left: s(27), top: s(41) }}>
              <Bag coffee={leftCoffee} width={s(89)} height={s(183)} onPress={onPressCoffee ? () => onPressCoffee(leftCoffee.id) : undefined} />
            </View>
          )}
        </View>
        <View style={{ width: s(145), height: s(224), position: 'relative' }}>
          {rightCoffee && (
            <View style={{ position: 'absolute', left: s(28), top: s(43) }}>
              <Bag coffee={rightCoffee} width={s(88)} height={s(181)} onPress={onPressCoffee ? () => onPressCoffee(rightCoffee.id) : undefined} />
            </View>
          )}
        </View>
      </View>
    );
  }

  if (type === 'normal') {
    return (
      <View style={{ flexDirection: 'row', gap: s(32), alignItems: 'center' }}>
        <View style={{ width: s(143), height: s(200), position: 'relative' }}>
          {leftCoffee && (
            <View style={{ position: 'absolute', left: s(27), top: s(18) }}>
              <Bag coffee={leftCoffee} width={s(89)} height={s(183)} onPress={onPressCoffee ? () => onPressCoffee(leftCoffee.id) : undefined} />
            </View>
          )}
        </View>
        <View style={{ width: s(145), height: s(200), position: 'relative' }}>
          {rightCoffee && (
            <View style={{ position: 'absolute', left: s(29), top: s(18) }}>
              <Bag coffee={rightCoffee} width={s(88)} height={s(183)} onPress={onPressCoffee ? () => onPressCoffee(rightCoffee.id) : undefined} />
            </View>
          )}
        </View>
      </View>
    );
  }

  // open — bags bottom-aligned, no cubby
  return (
    <View style={{ height: s(194), flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: s(48) }}>
      {leftCoffee ? (
        <Bag coffee={leftCoffee} width={s(88)} height={s(181)} onPress={onPressCoffee ? () => onPressCoffee(leftCoffee.id) : undefined} />
      ) : (
        <View style={{ width: s(88) }} />
      )}
      {rightCoffee ? (
        <Bag coffee={rightCoffee} width={s(89)} height={s(183)} onPress={onPressCoffee ? () => onPressCoffee(rightCoffee.id) : undefined} />
      ) : (
        <View style={{ width: s(89) }} />
      )}
    </View>
  );
}
