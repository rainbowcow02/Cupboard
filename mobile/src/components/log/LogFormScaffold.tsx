import { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors, fonts } from '@shared/theme';
import { GlassBackButton } from '../GlassBackButton';
import { TAB_BAR_HEIGHT } from '../TabBar';

const AnimatedKAScrollView = Animated.createAnimatedComponent(KeyboardAwareScrollView);

interface Props {
  onBack: () => void;
  title: string;
  description?: string;
  /** Safe-area bottom inset, used to pad scroll content above the tab bar. */
  bottomInset: number;
  children: React.ReactNode;
}

/**
 * Shared layout for the Log flow's form screens: a transparent floating header
 * with a glass back button that gains a frosted circle as content scrolls under
 * it, plus a left-aligned title / description block. Mirrors the Set recipe and
 * coffee detail pages so the back affordance is consistent across the app.
 */
export function LogFormScaffold({ onBack, title, description, bottomInset, children }: Props) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const bottomPad = Math.max(bottomInset, 16) + TAB_BAR_HEIGHT + 48;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {/* Offset + gentle ramp so the frosted circle eases in smoothly on scroll
            rather than snapping in immediately. */}
        <GlassBackButton
          onPress={onBack}
          scrollY={scrollY}
          fadeStart={16}
          fadeEnd={64}
          style={styles.backButton}
        />
      </View>

      <AnimatedKAScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        enableOnAndroid
        extraScrollHeight={24}
        enableResetScrollToCoords={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {children}
      </AnimatedKAScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { marginLeft: -14 },
  content: { paddingHorizontal: 24, paddingTop: 64 },
  titleBlock: { gap: 4, marginTop: 8, marginBottom: 20 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.black,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
    color: colors.greyDark,
    lineHeight: 21,
  },
});
