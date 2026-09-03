import { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors, fonts } from '@shared/theme';
import { GlassBackButton } from '../GlassBackButton';
import { GlassCloseButton } from '../GlassCloseButton';
import { KeyboardAwareUpdateContext } from '../../lib/keyboardAwareUpdate';

/** The HOC attaches `update()` at runtime but the library's .d.ts omits it. */
type KeyboardAwareScrollHandle = InstanceType<typeof KeyboardAwareScrollView> & {
  update: () => void;
};

interface Props {
  onBack: () => void;
  /**
   * Leading affordance: a back chevron for a step inside a flow, or a dismiss X
   * for a sheet the user cancels out of (the iOS convention).
   */
  leadingIcon?: 'back' | 'close';
  /** Accessibility label for the leading button when the default doesn't fit. */
  leadingLabel?: string;
  /** Plain title / description block. Ignored when `header` is provided. */
  title?: string;
  description?: React.ReactNode;
  /** Custom header node rendered in place of the title / description block. */
  header?: React.ReactNode;
  /** Optional action rendered opposite the back button (e.g. a HeaderPillButton). */
  rightAction?: React.ReactNode;
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
export function LogFormScaffold({
  onBack,
  leadingIcon = 'back',
  leadingLabel,
  title,
  description,
  header,
  rightAction,
  bottomInset,
  children,
}: Props) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<KeyboardAwareScrollHandle>(null);
  // Presented as a modal that covers the tab bar, so only the safe-area bottom is needed.
  const bottomPad = Math.max(bottomInset, 16) + 48;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {/* Offset + gentle ramp so the frosted circle eases in smoothly on scroll
            rather than snapping in immediately. Size/spacing mirror the coffee-detail
            header so the back affordance is identical across the app. */}
        {leadingIcon === 'close' ? (
          <GlassCloseButton
            onPress={onBack}
            scrollY={scrollY}
            fadeStart={16}
            fadeEnd={64}
            size={40}
            accessibilityLabel={leadingLabel}
          />
        ) : (
          <GlassBackButton
            onPress={onBack}
            scrollY={scrollY}
            fadeStart={16}
            fadeEnd={64}
            size={40}
          />
        )}
        {rightAction}
      </View>

      {/* KeyboardAwareScrollView lifts a focused field above the keyboard. It forks
          our onScroll internally, so no Animated wrapper is needed; the back-button
          fade just runs on the JS driver. A small extraHeight keeps the trigger
          threshold tight: only a field the keyboard actually covers gets scrolled —
          and by the minimum needed — so fields already in view (e.g. brewer / grind /
          the beans·water·temp row) stay put, while the tall multiline "Pour structure"
          field is measured in full and brought fully into view. */}
      <KeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        enableOnAndroid
        extraHeight={32}
        enableResetScrollToCoords={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {header ?? (
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
        )}
        {/* Lets a growing multiline field (e.g. Tasting/Brew notes) re-trigger the
            scroll-into-view as it gains lines, not just on initial focus. */}
        <KeyboardAwareUpdateContext.Provider value={() => scrollRef.current?.update()}>
          {children}
        </KeyboardAwareUpdateContext.Provider>
      </KeyboardAwareScrollView>
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
    justifyContent: 'space-between',
    minHeight: 36,
    // 16px on both edges so the back button — and any right-aligned action —
    // mirror the coffee-detail header spacing.
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
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
