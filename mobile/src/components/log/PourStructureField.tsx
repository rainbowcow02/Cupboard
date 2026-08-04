import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, fonts } from '@shared/theme';
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

/** Bloom, P1, P2, P3 — the fixed rows every recipe starts with; only rows added beyond these can be removed. */
const FIXED_ROW_COUNT = 4;

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
  const removePour = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <View style={styles.wrap}>
      {rows.map((pour, index) => {
        const label = pourDisplayLabel(index);

        if (index < FIXED_ROW_COUNT) {
          return (
            <View key={pour.id} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <TextInput
                style={[fieldInputStyle, styles.amountInput]}
                value={pour.amount}
                onChangeText={(v) => updatePour(index, { amount: v })}
                placeholder="ml"
                placeholderTextColor={colors.greyDark}
                keyboardType="decimal-pad"
                returnKeyType="done"
                accessibilityLabel={`${label} amount`}
              />
              <TextInput
                style={[fieldInputStyle, styles.noteInput]}
                value={pour.note}
                onChangeText={(v) => updatePour(index, { note: v })}
                placeholder="Notes"
                placeholderTextColor={colors.greyDark}
                returnKeyType="done"
                accessibilityLabel={`${label} notes`}
              />
            </View>
          );
        }

        return (
          <RemovablePourRow
            key={pour.id}
            label={label}
            amount={pour.amount}
            note={pour.note}
            onChangeAmount={(v) => updatePour(index, { amount: v })}
            onChangeNote={(v) => updatePour(index, { note: v })}
            onRemove={() => removePour(index)}
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

/** How far the row settles open, and the point past which the icon starts growing beyond full size. */
const OPEN_WIDTH = 72;
/** Divides overshoot distance past OPEN_WIDTH, so the further you pull, the more resistance kicks in. */
const OVERSHOOT_DIVISOR = 3;
const CLOSE_THRESHOLD = -40;

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
 * instead of leaving it to chance.
 */
function RemovablePourRow({
  label,
  amount,
  note,
  onChangeAmount,
  onChangeNote,
  onRemove,
}: {
  label: string;
  amount: string;
  note: string;
  onChangeAmount: (v: string) => void;
  onChangeNote: (v: string) => void;
  onRemove: () => void;
}) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

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
        })
        .onUpdate((e) => {
          const raw = Math.min(0, startX.value + e.translationX);
          translateX.value =
            raw < -OPEN_WIDTH ? -(OPEN_WIDTH + (-raw - OPEN_WIDTH) / OVERSHOOT_DIVISOR) : raw;
        })
        .onEnd(() => {
          translateX.value = withSpring(translateX.value < CLOSE_THRESHOLD ? -OPEN_WIDTH : 0, {
            damping: 20,
            stiffness: 220,
          });
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
                onPress={onRemove}
                style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${label}`}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={rowStyle}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <GestureDetector gesture={amountNative}>
              <TextInput
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
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(120,120,128,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnPressed: { opacity: 0.6 },
  removeBtnText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.greyDark,
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
