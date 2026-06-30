import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, surfaces } from '@shared/theme';

import MugIcon from '../../assets/icon-mug.svg';
import PinIcon from '../../assets/icon-pin.svg';
import LogIcon from '../../assets/icon-log.svg';
import BeanIcon from '../../assets/icon-bean.svg';
import { FloatingSurfacePill } from './surfaces/FloatingSurfacePill';
import { SearchIcon } from './SearchIcon';

const TAB_ICONS: Record<string, React.FC<{ width: number; height: number }>> = {
  index: MugIcon,
  explore: PinIcon,
  log: LogIcon,
  beans: BeanIcon,
};

const PILL_H = 64;
export const TAB_BAR_HEIGHT = PILL_H + 16; // pill + margin above safe area; screens add insets.bottom themselves
const PILL_PAD = 2; // horizontal padding inside pill — matches web's 2px
const SIDE_PADDING = 25;
const GAP = 16;
const SEARCH_SIZE = 59;
const TAB_W = 72;        // fixed tab width — matches web exactly
const ACTIVE_PILL_W = 76; // matches web's 76px active pill (= TAB_W + 2px bleed each side)
const TAB_STEP = TAB_W - 8; // = 64px per step, accounting for -8px tab gap

// Matches web's cubic-bezier(0.34, 1.56, 0.64, 1) — slight overshoot bounce
const SLIDE_SPRING = { damping: 18, stiffness: 220, mass: 0.8 };
const SCALE_SPRING = { damping: 14, stiffness: 250 };

// Tab-bar-specific shadow — crisper/darker than the shared surfaces.shadow so the
// pill reads as a distinct layer against scrolling cards. Kept local on purpose:
// surfaces.shadow is shared by bottom sheets and the beans screen.
const pillShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  android: { elevation: 12 },
  web: {
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.18)',
  },
});

// ─── Tab item (own scale animation) ───────────────────────────────────────────

type TabItemProps = {
  route: { key: string; name: string };
  descriptor: { options: { title?: string } };
  isFocused: boolean;
  isLast: boolean;
  onPress: () => void;
};

function TabItem({ route, descriptor, isFocused, isLast, onPress }: TabItemProps) {
  const scale = useSharedValue(isFocused ? 1.08 : 1);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.08 : 1, SCALE_SPRING);
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const Icon = TAB_ICONS[route.name];
  const label = descriptor.options.title ?? route.name;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, { marginRight: isLast ? 0 : -8 }]}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        {Icon && <Icon width={28} height={28} />}
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

// ─── Search button ─────────────────────────────────────────────────────────────

function SearchButton() {
  return (
    <View style={[styles.searchShadow, pillShadow]}>
      <View style={styles.searchInner}>
        <FloatingSurfacePill borderRadius={SEARCH_SIZE / 2} />
        <SearchIcon size={28} />
      </View>
    </View>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  const pillW = screenW - SIDE_PADDING * 2 - GAP - SEARCH_SIZE;

  const activeX = useSharedValue(state.index * TAB_STEP);

  useEffect(() => {
    activeX.value = withSpring(state.index * TAB_STEP, SLIDE_SPRING);
  }, [state.index]);

  const activePillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeX.value }],
  }));

  return (
    <View
      style={[styles.container, { bottom: Math.max(insets.bottom, 16) }]}
      pointerEvents="box-none"
    >
      <View style={[styles.pillContainer, { width: pillW }]}>
        <View style={[styles.outerPillShadow, pillShadow]} />
        <View style={styles.outerPillClip}>
          <FloatingSurfacePill />
        </View>

        <View style={styles.pillInner}>
          <Animated.View
            style={[styles.activePill, { width: ACTIVE_PILL_W }, activePillStyle]}
          />

          {state.routes.map((route, i) => (
            <TabItem
              key={route.key}
              route={route}
              descriptor={descriptors[route.key]}
              isFocused={state.index === i}
              isLast={i === state.routes.length - 1}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (state.index !== i && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          ))}
        </View>
      </View>

      <SearchButton />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SIDE_PADDING,
    right: SIDE_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  pillContainer: {
    height: PILL_H,
  },
  outerPillShadow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: surfaces.pillRadius,
  },
  outerPillClip: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: surfaces.pillRadius,
    overflow: 'hidden',
  },
  pillInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: surfaces.pillRadius,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingHorizontal: PILL_PAD,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: surfaces.pillRadius,
    backgroundColor: 'rgba(252, 153, 155, 0.5)',
  },
  tab: {
    width: TAB_W,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 7,
    paddingHorizontal: 8,
    gap: 3,
  },
  iconWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Avenir',
    fontSize: 12,
    color: colors.burgundy,
    fontWeight: '500',
    lineHeight: 13,
  },
  searchShadow: {
    width: SEARCH_SIZE,
    height: SEARCH_SIZE,
    borderRadius: SEARCH_SIZE / 2,
  },
  searchInner: {
    width: SEARCH_SIZE,
    height: SEARCH_SIZE,
    borderRadius: SEARCH_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
