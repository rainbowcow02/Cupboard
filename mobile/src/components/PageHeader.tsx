import { ReactNode, useState } from 'react';
import {
  ScrollViewProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, fonts } from '@shared/theme';

const HEADER_COLLAPSE_DISTANCE = 96;
const LAYOUT_PHASE_START = 0.25;
const HEADER_CONTENT_HEIGHT = 48;
const HEADER_CONTENT_SHRINK = 0.16;
const AVATAR_OPTICAL_OFFSET = 6;
const HEADER_PADDING_TOP_EXPANDED = 16;
const HEADER_PADDING_TOP_COLLAPSED = 2;
const HEADER_PADDING_BOTTOM_COLLAPSED = 2;
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapseProgress = useSharedValue(0);
  const collapsedState = useSharedValue(false);

  const handleScroll = useAnimatedScrollHandler((event) => {
    const y = Math.max(event.contentOffset.y, 0);
    const nextProgress = Math.min(y / HEADER_COLLAPSE_DISTANCE, 1);
    collapseProgress.value = nextProgress;

    const nextCollapsedState = nextProgress >= 1;
    if (nextCollapsedState !== collapsedState.value) {
      collapsedState.value = nextCollapsedState;
      runOnJS(setIsCollapsed)(nextCollapsedState);
    }
  });

  const expandedStyle = useAnimatedStyle(() => {
    const titleProgress = Easing.inOut(Easing.ease)(collapseProgress.value);
    return {
      opacity: 1 - titleProgress,
      transform: [
        { scale: 1 - HEADER_CONTENT_SHRINK * titleProgress },
      ],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    const rawLayoutProgress = Math.max(
      (collapseProgress.value - LAYOUT_PHASE_START) / (1 - LAYOUT_PHASE_START),
      0,
    );
    const layoutProgress = Easing.inOut(Easing.ease)(rawLayoutProgress);
    return {
      paddingTop: HEADER_PADDING_TOP_EXPANDED -
        (HEADER_PADDING_TOP_EXPANDED - HEADER_PADDING_TOP_COLLAPSED) * layoutProgress,
      paddingBottom: HEADER_PADDING_BOTTOM_COLLAPSED * layoutProgress,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const rawLayoutProgress = Math.max(
      (collapseProgress.value - LAYOUT_PHASE_START) / (1 - LAYOUT_PHASE_START),
      0,
    );
    const layoutProgress = Easing.inOut(Easing.ease)(rawLayoutProgress);
    return {
      height: HEADER_CONTENT_HEIGHT * (1 - layoutProgress),
    };
  });

  const avatarStyle = useAnimatedStyle(() => {
    const rawLayoutProgress = Math.max(
      (collapseProgress.value - LAYOUT_PHASE_START) / (1 - LAYOUT_PHASE_START),
      0,
    );
    const layoutProgress = Easing.inOut(Easing.ease)(rawLayoutProgress);
    return {
      transform: [
        { translateY: AVATAR_OPTICAL_OFFSET },
        { scale: 1 - layoutProgress },
      ],
    };
  });

  const stickyContentStyle = useAnimatedStyle(() => {
    const rawLayoutProgress = Math.max(
      (collapseProgress.value - LAYOUT_PHASE_START) / (1 - LAYOUT_PHASE_START),
      0,
    );
    const layoutProgress = Easing.inOut(Easing.ease)(rawLayoutProgress);
    return {
      marginTop: STICKY_CONTENT_GAP_EXPANDED -
        (STICKY_CONTENT_GAP_EXPANDED - STICKY_CONTENT_GAP_COLLAPSED) * layoutProgress,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.header, headerStyle]}
        accessibilityRole="header"
      >
        <Animated.View style={[styles.content, contentStyle]}>
          <Animated.View
            style={[styles.expandedRow, expandedStyle]}
            pointerEvents={isCollapsed ? 'none' : 'auto'}
            importantForAccessibility={isCollapsed ? 'no-hide-descendants' : 'auto'}
          >
            <Text style={styles.title}>{title}</Text>
            {avatarInitial ? (
              <Animated.View style={[styles.avatar, avatarStyle]}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        </Animated.View>
        {stickyContent && (
          <Animated.View style={[styles.stickyContent, stickyContentStyle]}>{stickyContent}</Animated.View>
        )}
      </Animated.View>
      <Animated.ScrollView
        {...scrollViewProps}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {children}
      </Animated.ScrollView>
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
    paddingTop: HEADER_PADDING_TOP_EXPANDED,
    paddingBottom: 0,
    backgroundColor: colors.pearl,
  },
  content: {
    height: HEADER_CONTENT_HEIGHT,
    overflow: 'hidden',
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
  title: {
    fontFamily: fonts.serif,
    fontSize: 38,
    color: colors.black,
    letterSpacing: -1,
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
    fontWeight: '800',
    fontSize: 21,
    color: colors.pearl,
  },
});
