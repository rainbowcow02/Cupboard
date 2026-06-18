// TEMP: debug harness for BrewCard expand/collapse — remove when done

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fonts } from '@shared/theme';
import { Card } from './Card';
import { SortChevron } from './SortChevron';

const ANIMATION_DURATION = 320;
const ANIMATION_EASING = Easing.out(Easing.cubic);

interface Props {
  label: string;
  getCurrentScrollY?: () => number;
  scrollToY?: (y: number) => void;
}

interface AnchorSnapshot {
  screenY: number;
}

function ExpandLink({ expanded, onPress }: { expanded: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.expandLink}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'See less' : 'See more'}
      accessibilityState={{ expanded }}
      accessibilityHint={expanded ? 'Collapses test card details' : 'Expands test card details'}
    >
      <Text style={styles.expandLinkText}>{expanded ? 'See less' : 'See more'}</Text>
      <SortChevron flipped={expanded} color={colors.greyDark} />
    </Pressable>
  );
}

function BodyContent() {
  return (
    <Text style={styles.bodyText}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
      exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    </Text>
  );
}

export function BrewCardAccordionTest({ label, getCurrentScrollY, scrollToY }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState(0);

  const buttonRef = useRef<View>(null);
  const anchorRef = useRef<AnchorSnapshot | null>(null);
  const hasInitializedLayoutRef = useRef(false);
  const heightAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;

  const recordExpandedHeight = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setExpandedHeight((current) => (Math.abs(current - height) < 0.5 ? current : height));
  }, []);

  useEffect(() => {
    if (expandedHeight <= 0) {
      return;
    }

    const targetHeight = isExpanded ? expandedHeight : 0;
    const targetOpacity = isExpanded ? 1 : 0;
    let collapseScrollListener: string | undefined;

    if (!hasInitializedLayoutRef.current) {
      heightAnimation.setValue(targetHeight);
      opacityAnimation.setValue(targetOpacity);
      hasInitializedLayoutRef.current = true;
      return;
    }

    heightAnimation.stopAnimation((startHeight) => {
      const anchor = anchorRef.current;
      const startScrollY = getCurrentScrollY?.() ?? 0;

      if (!isExpanded && anchor && scrollToY) {
        collapseScrollListener = heightAnimation.addListener(({ value }) => {
          scrollToY(startScrollY + value - startHeight);
        });
      }

      Animated.parallel([
        Animated.timing(heightAnimation, {
          duration: ANIMATION_DURATION,
          easing: ANIMATION_EASING,
          toValue: targetHeight,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnimation, {
          duration: Math.round(ANIMATION_DURATION * 0.7),
          easing: ANIMATION_EASING,
          toValue: targetOpacity,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (collapseScrollListener) {
          heightAnimation.removeListener(collapseScrollListener);
        }

        const buttonNode = buttonRef.current;
        if (!finished || !anchor || !buttonNode || !scrollToY) {
          anchorRef.current = null;
          return;
        }

        buttonNode.measureInWindow((_x, screenY) => {
          const nextScrollY = (getCurrentScrollY?.() ?? 0) + screenY - anchor.screenY;
          scrollToY(nextScrollY);
          anchorRef.current = null;
        });
      });
    });

    return () => {
      if (collapseScrollListener) {
        heightAnimation.removeListener(collapseScrollListener);
      }
      heightAnimation.stopAnimation();
      opacityAnimation.stopAnimation();
    };
  }, [
    expandedHeight,
    isExpanded,
    heightAnimation,
    opacityAnimation,
    getCurrentScrollY,
    scrollToY,
  ]);

  const toggleCard = useCallback(() => {
    const nextExpanded = !isExpanded;
    const buttonNode = buttonRef.current;

    if (!nextExpanded && buttonNode) {
      buttonNode.measureInWindow((_x, screenY) => {
        anchorRef.current = { screenY };
        setIsExpanded(false);
      });
      return;
    }

    anchorRef.current = null;
    setIsExpanded(nextExpanded);
  }, [isExpanded]);

  const hasMeasurement = expandedHeight > 0;

  return (
    <Card
      accessibilityRole="summary"
      accessibilityLabel={`Test card ${label}`}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Test card: {label}</Text>
      </View>

      <Text style={styles.summary}>
        Always-visible summary text for accordion debugging.
      </Text>

      {hasMeasurement ? (
        <Animated.View style={[styles.animatedBody, { height: heightAnimation }]}>
          <Animated.View style={[styles.bodyLayer, { opacity: opacityAnimation }]}>
            <BodyContent />
          </Animated.View>
        </Animated.View>
      ) : null}

      <View style={styles.measurementHost} pointerEvents="none" onLayout={recordExpandedHeight}>
        <BodyContent />
      </View>

      <View style={styles.expandFooter}>
        <View ref={buttonRef} collapsable={false}>
          <ExpandLink expanded={isExpanded} onPress={toggleCard} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: fonts.condensed,
    fontWeight: '600',
    fontSize: 17,
    color: colors.black,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  summary: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    lineHeight: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  bodyText: {
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 15,
    color: colors.black,
    lineHeight: 22.5,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  animatedBody: {
    overflow: 'hidden',
    position: 'relative',
  },
  bodyLayer: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  measurementHost: {
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  expandFooter: { paddingTop: 8, paddingBottom: 16 },
  expandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'stretch',
    paddingHorizontal: 24,
  },
  expandLinkText: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 14,
    color: colors.greyDark,
    lineHeight: 21,
  },
});
