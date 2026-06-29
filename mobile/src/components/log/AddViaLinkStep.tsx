import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Coffee } from '@shared/lib/coffees';
import { colors } from '@shared/theme';
import { extractBean, ExtractedBean } from '../../lib/api';
import { ErrorBox } from '../ErrorBox';
import { FormField, fieldInputStyle } from '../FormField';
import { PrimaryButton } from '../PrimaryButton';
import { LogFormScaffold } from './LogFormScaffold';
import { NewBeanDraft, NewBeanStep } from './NewBeanStep';

interface Props {
  bottomInset: number;
  onBack: () => void;
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
export function AddViaLinkStep({ bottomInset, onBack, onConfirm }: Props) {
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
        onBack={() => setDraft(null)}
        initialDraft={draft}
        title="Review details"
        description="Edit anything we pulled in before saving."
        submitLabel="Save coffee"
        onContinue={onConfirm}
      />
    );
  }

  return (
    <LogFormScaffold
      onBack={onBack}
      title="Add via link"
      description="Paste a link to a coffee and we’ll pull in the bean, origin, process, and tasting notes for you to review."
      bottomInset={bottomInset}
    >
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
    </LogFormScaffold>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
  error: { marginBottom: 16 },
  submit: { marginTop: 24 },
});
