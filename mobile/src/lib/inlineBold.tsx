import { ReactNode } from 'react';
import { Text, TextStyle } from 'react-native';

const BOLD_PATTERN = /\*([^*\n]+?)\*/g;

/**
 * Splits `text` on `*word*` markdown-lite bold spans — the mobile-only
 * storage convention: bold is never rendered live while typing (see
 * textAutoFormat.ts), matching how bullets are stored as literal "-" and
 * only rendered as "•" at display time. Returns an array of plain strings
 * and bold <Text> spans, safe to nest directly inside a parent <Text>.
 * Returns `[text]` unchanged when no bold markers are present.
 */
export function renderInlineBold(text: string, boldStyle: TextStyle): ReactNode[] {
  if (!text.includes('*')) return [text];

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  BOLD_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = BOLD_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <Text key={`bold-${key++}`} style={boldStyle}>
        {match[1]}
      </Text>,
    );
    lastIndex = BOLD_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
