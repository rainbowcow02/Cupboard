import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, fonts, surfaces } from '@shared/theme';
import { fieldInputStyle } from '../FormField';
import { useKeyboardAwareUpdate } from '../../lib/keyboardAwareUpdate';
import { defaultPours, emptyPour, pourDisplayLabel, PourFormEntry } from '../../lib/pourStructure';

interface Props {
  pours: PourFormEntry[];
  onChange: (pours: PourFormEntry[]) => void;
  /** Free-form note covering agitation, timing, or anything else — hidden behind "+ Add note" until needed. */
  note: string;
  onNoteChange: (note: string) => void;
}

/** Bloom + first pour are always kept so a recipe can never be swiped down to nothing pourable. */
const MIN_POUR_ROWS = 2;

export function PourStructureField({ pours, onChange, note, onNoteChange }: Props) {
  // Hidden by default for a new recipe; auto-shown when editing/duplicating one that already has a note.
  const [showNote, setShowNote] = useState(() => note.trim().length > 0);
  const rows = pours.length ? pours : defaultPours();
  // Growing the free-note field only re-triggers the keyboard-aware scroll on
  // content-size change — the library itself only measures on initial focus.
  const keepInView = useKeyboardAwareUpdate();

  const updatePour = (index: number, patch: Partial<PourFormEntry>) => {
    onChange(rows.map((pour, i) => (i === index ? { ...pour, ...patch } : pour)));
  };

  const addPour = () => onChange([...rows, emptyPour()]);
  const removePour = (index: number) => {
    if (rows.length <= MIN_POUR_ROWS) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.wrap}>
      {rows.map((pour, index) => {
        const label = pourDisplayLabel(index);

        return (
          <RemovablePourRow
            key={pour.id}
            label={label}
            amount={pour.amount}
            note={pour.note}
            onChangeAmount={(v) => updatePour(index, { amount: v })}
            onChangeNote={(v) => updatePour(index, { note: v })}
            onRemove={() => removePour(index)}
            disabled={rows.length <= MIN_POUR_ROWS}
          />
        );
      })}

      <View style={styles.linkRow}>
        <Pressable
          onPress={addPour}
          style={styles.linkBtn}
          accessibilityRole="button"
          accessibilityLabel="Add another pour"
        >
          <Text style={styles.linkBtnText}>+ Add pour</Text>
        </Pressable>
        {!showNote ? (
          <Pressable
            onPress={() => setShowNote(true)}
            style={styles.linkBtn}
            accessibilityRole="button"
            accessibilityLabel="Add a note"
          >
            <Text style={styles.linkBtnText}>+ Add note</Text>
          </Pressable>
        ) : null}
      </View>

      {showNote ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Note</Text>
          <TextInput
            style={[fieldInputStyle, styles.freeNoteInput]}
            value={note}
            onChangeText={onNoteChange}
            onContentSizeChange={keepInView}
            placeholder="Agitation, timing, etc."
            placeholderTextColor={colors.greyDark}
            multiline
            textAlignVertical="top"
            returnKeyType="done"
            accessibilityLabel="Pour notes"
          />
        </View>
      ) : null}
    </View>
  );
}

/** How far the row settles open, and the point past which the icon starts growing beyond full size.
 *  Wide enough for the "✕ Delete" pill (not just a small icon) — more travel also gives the swipe
 *  more perceptible weight, since the spring has real distance to cover rather than a short hop. */
const OPEN_WIDTH = 96;
/** Asymptote distance for overshoot past OPEN_WIDTH. Using c=1 in the classic rubber-band
 *  formula (distance = (1 - 1/(x/d + 1)) * d) gives slope 1 at x=0, so resistance picks up
 *  seamlessly from the 1:1 tracking below OPEN_WIDTH with no kink, then progressively resists. */
const OVERSHOOT_RUBBER_BAND_D = OPEN_WIDTH;
const OPEN_DISTANCE_THRESHOLD = -50;
/** A flick faster than this (px/s) commits open/closed immediately regardless of distance dragged. */
const FLING_VELOCITY = 800;
/**
 * Spring, not timing: springs are interruptible and velocity-continuous, so rapid repeated
 * swipes stay fluid instead of replaying an identical fixed-duration curve every release.
 * overshootClamping keeps the single-direction, no-bounce-back settle already confirmed.
 */
const SWIPE_SPRING = { damping: 26, stiffness: 240, mass: 0.9, overshootClamping: true };

/**
 * A pour row that swipes left to reveal a delete icon, iMessage-style — the icon
 * grows and fades in as you pull (rather than sliding in at a fixed size), and the
 * row can keep being dragged past the reveal point with rubber-band resistance.
 *
 * The amount/notes fields each get their own `Gesture.Native()`, and the pan gesture
 * `blocksExternalGesture`s them. Without that, a fast swipe starting on a field can
 * still pop the keyboard: the field's own focus gesture and this pan gesture are two
 * independent native recognizers racing the same touch, and which one wins depends on
 * native-thread timing. Composing them this way makes the swipe win deterministically
 * instead of leaving it to chance. That only resolves the first-touch race though — once
 * the row is sitting open, a later, separate tap could still land on a field and focus it,
 * so `locked` additionally gates the fields for as long as the row isn't fully closed.
 */
function RemovablePourRow({
  label,
  amount,
  note,
  onChangeAmount,
  onChangeNote,
  onRemove,
  disabled,
}: {
  label: string;
  amount: string;
  note: string;
  onChangeAmount: (v: string) => void;
  onChangeNote: (v: string) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const [locked, setLocked] = useState(false);

  const amountNative = useMemo(() => Gesture.Native(), []);
  const noteNative = useMemo(() => Gesture.Native(), []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-10, 10])
        .blocksExternalGesture(amountNative, noteNative)
        .onStart(() => {
          startX.value = translateX.value;
          runOnJS(setLocked)(true);
        })
        .onUpdate((e) => {
          const raw = Math.min(0, startX.value + e.translationX);
          if (raw >= -OPEN_WIDTH) {
            translateX.value = raw;
            return;
          }
          const overshoot = -raw - OPEN_WIDTH;
          const resisted = (overshoot * OVERSHOOT_RUBBER_BAND_D) / (overshoot + OVERSHOOT_RUBBER_BAND_D);
          translateX.value = -(OPEN_WIDTH + resisted);
        })
        .onEnd((e) => {
          const flungOpen = e.velocityX < -FLING_VELOCITY;
          const flungClosed = e.velocityX > FLING_VELOCITY;
          const shouldOpen = flungClosed
            ? false
            : flungOpen
              ? true
              : translateX.value < OPEN_DISTANCE_THRESHOLD;
          const target = shouldOpen ? -OPEN_WIDTH : 0;

          translateX.value = withSpring(
            target,
            { ...SWIPE_SPRING, velocity: e.velocityX },
            (finished) => {
              if (finished && target === 0) {
                runOnJS(setLocked)(false);
              }
            },
          );
        }),
    [amountNative, noteNative, startX, translateX],
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Kept fully off-screen until the row actually starts moving, so it can never bleed
  // through the row's own internal gaps (label/input spacing) while closed.
  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value < 0 ? 0 : 1000 }],
  }));

  const iconStyle = useAnimatedStyle(() => {
    const distance = Math.abs(translateX.value);
    return {
      opacity: interpolate(distance, [0, OPEN_WIDTH], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(distance, [0, OPEN_WIDTH, OPEN_WIDTH * 2], [0.4, 1, 1.15], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.swipeOuter}>
        <Animated.View style={[styles.revealLayer, revealStyle]}>
          <View style={styles.revealAction}>
            <Animated.View style={iconStyle}>
              <Pressable
                onPress={disabled ? undefined : onRemove}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.removeBtn,
                  pressed && styles.removeBtnPressed,
                  disabled && styles.removeBtnDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${label}`}
                accessibilityState={{ disabled }}
              >
                <Text style={styles.removeBtnText}>✕ Delete</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={rowStyle}>
          <View style={styles.row} pointerEvents={locked ? 'none' : 'auto'}>
            <Text style={styles.rowLabel}>{label}</Text>
            <GestureDetector gesture={amountNative}>
              <TextInput
                editable={!locked}
                style={[fieldInputStyle, styles.amountInput]}
                value={amount}
                onChangeText={onChangeAmount}
                placeholder="ml"
                placeholderTextColor={colors.greyDark}
                keyboardType="decimal-pad"
                returnKeyType="done"
                accessibilityLabel={`${label} amount`}
              />
            </GestureDetector>
            <GestureDetector gesture={noteNative}>
              <TextInput
                editable={!locked}
                style={[fieldInputStyle, styles.noteInput]}
                value={note}
                onChangeText={onChangeNote}
                placeholder="Notes"
                placeholderTextColor={colors.greyDark}
                returnKeyType="done"
                accessibilityLabel={`${label} notes`}
              />
            </GestureDetector>
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: {
    width: 92,
    flexShrink: 0,
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.black,
  },
  amountInput: { width: 80, paddingHorizontal: 10 },
  noteInput: { flex: 1, paddingHorizontal: 10 },
  swipeOuter: { overflow: 'hidden' },
  revealLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  revealAction: {
    width: OPEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: surfaces.pillRadius,
    backgroundColor: surfaces.clearButtonFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnPressed: { opacity: 0.6 },
  removeBtnDisabled: { opacity: 0.3 },
  removeBtnText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: surfaces.clearButtonText,
    lineHeight: 16,
  },
  linkRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  linkBtn: { paddingVertical: 4 },
  linkBtnText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.burgundy,
  },
  freeNoteInput: { flex: 1 },
});
