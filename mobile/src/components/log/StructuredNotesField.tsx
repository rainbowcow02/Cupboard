import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, surfaces } from '@shared/theme';
import { useKeyboardAwareUpdate } from '../../lib/keyboardAwareUpdate';
import { useAutoFormatTextInput } from '../../hooks/useAutoFormatTextInput';
import { AddLink } from '../AddLink';
import { Divider } from '../Divider';

interface Section {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
}

interface Props {
  top: Section;
  bottom: Section;
  /**
   * Empties both halves at once. When given, a "Clear" link shows below the box
   * whenever either half has text — handy when a cup is prefilled from a recipe.
   */
  onClear?: () => void;
  /** Screen-reader label for the Clear link, e.g. "Clear tasting notes". */
  clearAccessibilityLabel?: string;
}

/**
 * A single bordered field split into two stacked, hint-driven inputs (e.g. Smell/Taste,
 * Thoughts/To Try) so a user never has to hand-type the markers that make the Brew Card
 * and Notion's "Recipe to test" column render them as structured sections.
 */
export function StructuredNotesField({ top, bottom, onClear, clearAccessibilityLabel }: Props) {
  const hasText = top.value.trim() !== '' || bottom.value.trim() !== '';
  return (
    <View>
      <View style={styles.box}>
        <NotesSection section={top} />
        <Divider />
        <NotesSection section={bottom} />
      </View>
      {onClear && hasText ? (
        <View style={styles.linkRow}>
          <AddLink label="Clear" onPress={onClear} accessibilityLabel={clearAccessibilityLabel} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * One half of the box. The whole half — padding included — focuses its input:
 * the input itself is only one line tall, so a tap on the box's padding or the
 * space around the divider used to do nothing.
 */
function NotesSection({ section }: { section: Section }) {
  // Growing a multiline field only re-triggers the keyboard-aware scroll on
  // content-size change — the library itself only measures on initial focus.
  const keepInView = useKeyboardAwareUpdate();
  const autoFormat = useAutoFormatTextInput(section.value, section.onChange);
  const inputRef = useRef<TextInput>(null);

  return (
    // Not an accessibility element itself: the TextInput inside is the control
    // screen readers focus, so exposing the wrapper too would read it twice.
    <Pressable
      style={styles.section}
      onPress={() => inputRef.current?.focus()}
      accessible={false}
    >
      <TextInput
        ref={inputRef}
        style={styles.input}
        {...autoFormat}
        onContentSizeChange={keepInView}
        placeholder={section.placeholder}
        placeholderTextColor={colors.greyDark}
        multiline
        textAlignVertical="top"
        returnKeyType="done"
        accessibilityLabel={section.accessibilityLabel}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Vertical spacing lives on each section (not the box) so it's tappable;
  // 10px above and below each input matches the previous box padding + gap.
  box: {
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.14)',
    backgroundColor: surfaces.pillFill,
  },
  section: { paddingVertical: 10 },
  linkRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  input: {
    minHeight: 20,
    padding: 0,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.black,
  },
});
