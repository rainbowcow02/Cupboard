// TEMP: debug harness for BrewCard expand/collapse — remove when done

import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '@shared/theme';
import { Card } from './Card';
import { SortChevron } from './SortChevron';

const ANIMATION_DURATION = 300;
const ANIMATION_EASING = Easing.out(Easing.cubic);

interface Props {
  label: string;
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

function AccordionSection({
  heightProgress,
  contentHeight,
  expanded,
  children,
}: {
  heightProgress: SharedValue<number>;
  contentHeight: SharedValue<number>;
  expanded: boolean;
  children: ReactNode;
}) {
  const accordionStyle = useAnimatedStyle(() => ({
    height: contentHeight.value * heightProgress.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View
      style={[styles.accordion, accordionStyle]}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
    >
      <View
        collapsable={false}
        style={styles.accordionContent}
        onLayout={(e) => {
          contentHeight.value = e.nativeEvent.layout.height;
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

export function BrewCardAccordionTest({ label }: Props) {
  const [expanded, setExpanded] = useState(false);
  const heightProgress = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  const handleExpandToggle = () => {
    const next = !expanded;
    setExpanded(next);
    heightProgress.value = withTiming(next ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

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

      <AccordionSection
        heightProgress={heightProgress}
        contentHeight={contentHeight}
        expanded={expanded}
      >
        <Text style={styles.bodyText}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </Text>
      </AccordionSection>

      <View style={styles.expandFooter}>
        <ExpandLink expanded={expanded} onPress={handleExpandToggle} />
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
  expandFooter: { paddingTop: 8, paddingBottom: 16 },
  accordion: { overflow: 'hidden' },
  accordionContent: { position: 'absolute', left: 0, right: 0, top: 0 },
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
