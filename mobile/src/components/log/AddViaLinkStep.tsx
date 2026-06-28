import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Coffee } from '@shared/lib/coffees';
import { colors, fonts } from '@shared/theme';
import { extractBean, ExtractedBean } from '../../lib/api';
import { ErrorBox } from '../ErrorBox';
import { FormField, fieldInputStyle } from '../FormField';
import { PrimaryButton } from '../PrimaryButton';
import { TAB_BAR_HEIGHT } from '../TabBar';
import { NewBeanDraft, NewBeanStep } from './NewBeanStep';

interface Props {
  bottomInset: number;
  onConfirm: (coffee: Coffee) => void;
}

function draftFrom(extracted: ExtractedBean): Partial<NewBeanDraft> {
  return {
    bean: extracted.bean ?? '',
    roaster: extracted.roaster ?? '',
    origin: extracted.origin ?? '',
    process: extracted.process ?? '',
    roastLevel: extracted.roastLevel ?? '',
    region: extracted.region ?? '',
    variety: extracted.variety ?? '',
    notes: extracted.notes ?? '',
  };
}

/**
 * Paste a roaster URL → extract the bean's details server-side → review and
 * edit in the standard new-bean form before saving.
 */
export function AddViaLinkStep({ bottomInset, onConfirm }: Props) {
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<NewBeanDraft> | null>(null);

  const pull = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Paste a link to a coffee to pull its details.');
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const extracted = await extractBean(trimmed);
      setDraft(draftFrom(extracted));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't read that link.");
    } finally {
      setExtracting(false);
    }
  };

  if (draft) {
    return (
      <NewBeanStep
        bottomInset={bottomInset}
        initialDraft={draft}
        prompt="Review the details we pulled in — edit anything before saving."
        submitLabel="Save coffee"
        onContinue={onConfirm}
      />
    );
  }

  const scrollBottomPad = Math.max(bottomInset, 16) + TAB_BAR_HEIGHT + 48;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.prompt}>
        Paste a link to a coffee on a roaster’s site and we’ll pull in the bean,
        origin, process, and tasting notes for you to review.
      </Text>

      {error ? <ErrorBox message={error} style={styles.error} /> : null}

      <View style={styles.fields}>
        <FormField label="Coffee link">
          <TextInput
            style={fieldInputStyle}
            value={url}
            onChangeText={setUrl}
            placeholder="https://roaster.com/coffees/…"
            placeholderTextColor={colors.greyDark}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={pull}
          />
        </FormField>
      </View>

      <PrimaryButton
        label="Pull details"
        busyLabel="Reading link…"
        busy={extracting}
        onPress={pull}
        style={styles.submit}
        accessibilityLabel="Pull bean details from the link"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 4 },
  prompt: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
    color: colors.greyDark,
    lineHeight: 21,
    marginBottom: 16,
  },
  fields: { gap: 14 },
  error: { marginBottom: 16 },
  submit: { marginTop: 24 },
});
