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
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@shared/theme';

import MugIcon from '../../assets/icon-mug.svg';
import PinIcon from '../../assets/icon-pin.svg';
import LogIcon from '../../assets/icon-log.svg';
import BeanIcon from '../../assets/icon-bean.svg';

const TAB_ICONS: Record<string, React.FC<{ width: number; height: number }>> = {
  index: MugIcon,
  explore: PinIcon,
  log: LogIcon,
  beans: BeanIcon,
};

const PILL_H = 64;
export const TAB_BAR_HEIGHT = PILL_H + 16; // pill + margin above safe area; screens add insets.bottom themselves
const PILL_PAD = 4; // inner padding on all sides — matches activePill top/bottom (4px) for even visual border
const SIDE_PADDING = 25;
const GAP = 16;
const SEARCH_SIZE = 59;
const TAB_COUNT = 4;

// Matches web's cubic-bezier(0.34, 1.56, 0.64, 1) — slight overshoot bounce
const SLIDE_SPRING = { damping: 18, stiffness: 220, mass: 0.8 };
const SCALE_SPRING = { damping: 14, stiffness: 250 };

const glassShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  android: { elevation: 12 },
});

// ─── Tab item (own scale animation) ───────────────────────────────────────────

type TabItemProps = {
  route: { key: string; name: string };
  descriptor: { options: { title?: string } };
  isFocused: boolean;
  tabW: number;
  onPress: () => void;
};

function TabItem({ route, descriptor, isFocused, tabW, onPress }: TabItemProps) {
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
      style={[styles.tab, { width: tabW }]}
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
    <View style={[styles.searchShadow, glassShadow]}>
      <View style={styles.searchInner}>
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.glassFill]} />
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Circle
            cx={11} cy={11} r={7}
            stroke={colors.burgundy}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <Path
            d="M16.5 16.5L21 21"
            stroke={colors.burgundy}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  const pillW = screenW - SIDE_PADDING * 2 - GAP - SEARCH_SIZE;
  const tabW = (pillW - PILL_PAD * 2) / TAB_COUNT;

  // Active pill offset starts at PILL_PAD so it aligns with the inset tab buttons
  const activeX = useSharedValue(PILL_PAD + state.index * tabW);

  useEffect(() => {
    activeX.value = withSpring(PILL_PAD + state.index * tabW, SLIDE_SPRING);
  }, [state.index, tabW]);

  const activePillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeX.value }],
  }));

  return (
    <View
      style={[styles.container, { bottom: Math.max(insets.bottom, 16) }]}
      pointerEvents="box-none"
    >
      {/* Main pill */}
      <View style={[styles.pillShadow, { width: pillW }, glassShadow]}>
        <View style={styles.pillInner}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.glassFill]} />

          {/* Sliding active indicator */}
          <Animated.View
            style={[styles.activePill, { width: tabW }, activePillStyle]}
          />

          {state.routes.map((route, i) => (
            <TabItem
              key={route.key}
              route={route}
              descriptor={descriptors[route.key]}
              isFocused={state.index === i}
              tabW={tabW}
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
  pillShadow: {
    height: PILL_H,
    borderRadius: 100,
  },
  pillInner: {
    flex: 1,
    borderRadius: 100,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingHorizontal: PILL_PAD,
  },
  glassFill: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  activePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(252, 153, 155, 0.5)',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
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
    fontSize: 10,
    color: colors.burgundy,
    fontWeight: '500',
    lineHeight: 12,
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
