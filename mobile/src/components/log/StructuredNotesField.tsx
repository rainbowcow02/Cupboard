import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, surfaces } from '@shared/theme';
import { useKeyboardAwareUpdate } from '../../lib/keyboardAwareUpdate';
import { useAutoFormatTextInput } from '../../hooks/useAutoFormatTextInput';
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
}

/**
 * A single bordered field split into two stacked, hint-driven inputs (e.g. Smell/Taste,
 * Thoughts/To Try) so a user never has to hand-type the markers that make the Brew Card
 * and Notion's "Recipe to test" column render them as structured sections.
 */
export function StructuredNotesField({ top, bottom }: Props) {
  // Growing a multiline field only re-triggers the keyboard-aware scroll on
  // content-size change — the library itself only measures on initial focus.
  const keepInView = useKeyboardAwareUpdate();
  const topAutoFormat = useAutoFormatTextInput(top.value, top.onChange);
  const bottomAutoFormat = useAutoFormatTextInput(bottom.value, bottom.onChange);

  return (
    <View style={styles.box}>
      <TextInput
        style={styles.input}
        {...topAutoFormat}
        onContentSizeChange={keepInView}
        placeholder={top.placeholder}
        placeholderTextColor={colors.greyDark}
        multiline
        textAlignVertical="top"
        returnKeyType="done"
        accessibilityLabel={top.accessibilityLabel}
      />
      <Divider />
      <TextInput
        style={styles.input}
        {...bottomAutoFormat}
        onContentSizeChange={keepInView}
        placeholder={bottom.placeholder}
        placeholderTextColor={colors.greyDark}
        multiline
        textAlignVertical="top"
        returnKeyType="done"
        accessibilityLabel={bottom.accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.14)',
    backgroundColor: surfaces.pillFill,
  },
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
