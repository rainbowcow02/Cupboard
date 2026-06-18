import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '@shared/theme';

const SCROLL_COLLAPSE_THRESHOLD = 40;
const SCROLL_EXPAND_THRESHOLD = 40;
const HEADER_CONTENT_HEIGHT = 48;
const COLLAPSED_TITLE_OFFSET = 10;
const EXPANDED_ROW_RISE = 8;
const EXPANDED_ROW_MIN_SCALE = 0.92;
const STICKY_CONTENT_GAP_EXPANDED = 16;
const STICKY_CONTENT_GAP_COLLAPSED = 4;

interface PageHeaderProps {
  title: string;
  avatarInitial?: string;
  children: ReactNode;
  stickyContent?: ReactNode;
  scrollViewProps?: Omit<ScrollViewProps, 'onScroll' | 'scrollEventThrottle'>;
}

export function PageHeader({ title, avatarInitial, children, stickyContent, scrollViewProps }: PageHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);
  const lastY = useRef(0);
  const upwardAccum = useRef(0);
  const collapseProgress = useSharedValue(0);

  useEffect(() => {
    collapseProgress.value = withTiming(isScrolled ? 1 : 0, { duration: 200 });
  }, [isScrolled, collapseProgress]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const diff = y - lastY.current;
    lastY.current = y;

    if (diff > 0) {
      upwardAccum.current = 0;
      if (!isScrolledRef.current && y > SCROLL_COLLAPSE_THRESHOLD) {
        isScrolledRef.current = true;
        setIsScrolled(true);
      }
    } else if (diff < 0) {
      upwardAccum.current += -diff;
      if (isScrolledRef.current && upwardAccum.current > SCROLL_EXPAND_THRESHOLD) {
        isScrolledRef.current = false;
        setIsScrolled(false);
      }
    }
  }, []);

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: 1 - collapseProgress.value,
    transform: [
      { translateY: -EXPANDED_ROW_RISE * collapseProgress.value },
      { scale: 1 - (1 - EXPANDED_ROW_MIN_SCALE) * collapseProgress.value },
    ],
  }));

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: collapseProgress.value,
    transform: [{ translateY: COLLAPSED_TITLE_OFFSET * (1 - collapseProgress.value) }],
  }));

  const stickyContentStyle = useAnimatedStyle(() => ({
    marginTop: STICKY_CONTENT_GAP_EXPANDED -
      (STICKY_CONTENT_GAP_EXPANDED - STICKY_CONTENT_GAP_COLLAPSED) * collapseProgress.value,
  }));

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, isScrolled && styles.headerCollapsed]}
        accessibilityRole="header"
      >
        <View style={styles.content}>
          <Animated.View
            style={[styles.expandedRow, expandedStyle]}
            pointerEvents={isScrolled ? 'none' : 'auto'}
            importantForAccessibility={isScrolled ? 'no-hide-descendants' : 'auto'}
          >
            <Text style={styles.title}>{title}</Text>
            {avatarInitial ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </View>
            ) : null}
          </Animated.View>
          <Animated.View
            style={[styles.collapsedRow, collapsedStyle]}
            pointerEvents={isScrolled ? 'auto' : 'none'}
            importantForAccessibility={isScrolled ? 'auto' : 'no-hide-descendants'}
          >
            <Text style={styles.collapsedTitle}>{title}</Text>
          </Animated.View>
        </View>
        {stickyContent && (
          <Animated.View style={[styles.stickyContent, stickyContentStyle]}>{stickyContent}</Animated.View>
        )}
      </View>
      <ScrollView
        {...scrollViewProps}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pearl,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: colors.pearl,
  },
  headerCollapsed: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  content: {
    height: HEADER_CONTENT_HEIGHT,
  },
  stickyContent: {
    marginHorizontal: -24,
  },
  expandedRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedRow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 38,
    color: colors.black,
    letterSpacing: -1,
  },
  collapsedTitle: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.black,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 21,
    color: colors.pearl,
  },
});
