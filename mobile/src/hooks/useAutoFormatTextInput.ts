import { useCallback, useState } from 'react';
import { applyAutoFormat } from '../lib/textAutoFormat';

export interface AutoFormatTextInputProps {
  value: string;
  onChangeText: (next: string) => void;
  selection: { start: number; end: number } | undefined;
  onSelectionChange: () => void;
}

/**
 * Wires the shared live "- " -> "• " / "->" -> "→" shortcuts (textAutoFormat.ts)
 * onto a controlled multiline TextInput. Spread the returned props onto the
 * TextInput in place of your own `value`/`onChangeText`; every other prop
 * (multiline, onContentSizeChange, placeholder, accessibilityLabel, …) is
 * untouched and should still be passed through as-is.
 */
export function useAutoFormatTextInput(
  value: string,
  onChangeText: (next: string) => void,
): AutoFormatTextInputProps {
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);

  const handleChangeText = useCallback(
    (next: string) => {
      const result = applyAutoFormat(value, next);
      if (result) {
        onChangeText(result.text);
        setSelection({ start: result.cursor, end: result.cursor });
      } else {
        onChangeText(next);
      }
    },
    [value, onChangeText],
  );

  // Releases the transient forced cursor back to the OS the moment it reports
  // a real selection — keeping `selection` permanently controlled fights the
  // native IME/cursor, especially on Android.
  const handleSelectionChange = useCallback(() => setSelection(undefined), []);

  return {
    value,
    onChangeText: handleChangeText,
    selection,
    onSelectionChange: handleSelectionChange,
  };
}
