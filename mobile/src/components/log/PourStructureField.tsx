import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, fonts } from '@shared/theme';
import { fieldInputStyle } from '../FormField';
import { defaultPours, emptyPour, pourDisplayLabel, PourFormEntry } from '../../lib/pourStructure';

interface Props {
  pours: PourFormEntry[];
  onChange: (pours: PourFormEntry[]) => void;
  /** Free-form note covering agitation, timing, or anything else — hidden behind "+ Add notes" until needed. */
  note: string;
  onNoteChange: (note: string) => void;
}

/** Bloom, P1, P2, P3 — the fixed rows every recipe starts with; only rows added beyond these can be removed. */
const FIXED_ROW_COUNT = 4;

export function PourStructureField({ pours, onChange, note, onNoteChange }: Props) {
  const [showNote, setShowNote] = useState(() => note.trim().length > 0);
  const rows = pours.length ? pours : defaultPours();

  const updatePour = (index: number, patch: Partial<PourFormEntry>) => {
    onChange(rows.map((pour, i) => (i === index ? { ...pour, ...patch } : pour)));
  };

  const addPour = () => onChange([...rows, emptyPour()]);
  const removePour = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <View style={styles.wrap}>
      {rows.map((pour, index) => {
        const label = pourDisplayLabel(index);
        const removable = index >= FIXED_ROW_COUNT;

        const row = (
          <View style={styles.row}>
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

        if (!removable) {
          return <View key={pour.id}>{row}</View>;
        }

        return (
          <Swipeable
            key={pour.id}
            overshootFriction={8}
            rightThreshold={40}
            renderRightActions={(progress) => (
              <PourRemoveAction progress={progress} label={label} onPress={() => removePour(index)} />
            )}
          >
            {row}
          </Swipeable>
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
            accessibilityLabel="Add pour notes"
          >
            <Text style={styles.linkBtnText}>+ Add notes</Text>
          </Pressable>
        ) : null}
      </View>

      {showNote ? (
        <TextInput
          style={[fieldInputStyle, styles.freeNoteInput]}
          value={note}
          onChangeText={onNoteChange}
          placeholder="Agitation, timing, anything else"
          placeholderTextColor={colors.greyDark}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
          accessibilityLabel="Pour notes"
        />
      ) : null}
    </View>
  );
}

/**
 * Revealed by swiping a removable pour row left; hidden until then. Grows in
 * size and fades in as the swipe progresses, iMessage-style, rather than
 * sliding in at a fixed size — `progress` keeps climbing past 1 the further
 * the row is overswiped, so the icon keeps growing (up to a cap) instead of
 * hitting a hard wall.
 */
function PourRemoveAction({
  progress,
  label,
  onPress,
}: {
  progress: Animated.AnimatedInterpolation<number>;
  label: string;
  onPress: () => void;
}) {
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const scale = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.4, 1, 1.15],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.revealAction}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      </Animated.View>
    </View>
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
  freeNoteInput: { minHeight: 72, paddingTop: 12 },
});
