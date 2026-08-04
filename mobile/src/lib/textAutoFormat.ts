/**
 * Live "as you type" auto-format for multiline note fields:
 *   "- " at the start of a line  -> "• "
 *   "->"                          -> "→"
 *
 * Deliberately narrow: this only recognizes a clean, small forward insertion
 * (the normal shape of a single typed keystroke) right at the point the user
 * is typing. Pastes, autofill, and deletions are left untouched — see
 * `applyAutoFormat` below for why.
 */

export interface AutoFormatResult {
  text: string;
  cursor: number;
}

/** Above this, an edit is treated as a paste/autofill/programmatic set, not live typing — skipped entirely. */
const MAX_LIVE_INSERT_LENGTH = 3;

/** "- " at column 0: either the very start of the text, or right after a newline. */
const BULLET_TRIGGER = /(?:^|\n)- $/;
const ARROW_TRIGGER = /->$/;

interface InsertionRange {
  /** Index in `next` where the inserted text begins. */
  start: number;
  /** Index in `next` where the inserted text ends (i.e. the caret, immediately after typing). */
  end: number;
}

/**
 * Finds the contiguous range in `next` that wasn't in `prev`, assuming a single
 * forward insertion — the near-universal shape of a live `onChangeText` edit.
 * Returns null for anything that isn't a clean insertion (a selection replace,
 * an edit touching two disjoint spots, etc.) so callers can skip the transform
 * rather than guess.
 */
function findInsertionRange(prev: string, next: string): InsertionRange | null {
  const inserted = next.length - prev.length;
  if (inserted <= 0) return null;

  let start = 0;
  while (start < prev.length && prev[start] === next[start]) {
    start += 1;
  }

  // Everything after the insertion point must line up once we skip past it,
  // or this wasn't a simple "type at one spot" edit.
  const end = start + inserted;
  if (prev.slice(start) !== next.slice(end)) return null;

  return { start, end };
}

/**
 * Given the previous controlled value and the just-typed next value from a
 * multiline TextInput's onChangeText, detects whether the user finished typing
 * a live-format trigger ("- " at start of line, or "->") right at the edit
 * point, and returns the substituted text plus where the cursor should land.
 * Returns null when nothing applies — callers should use `next` verbatim.
 */
export function applyAutoFormat(prev: string, next: string): AutoFormatResult | null {
  if (next.length <= prev.length || next.length - prev.length > MAX_LIVE_INSERT_LENGTH) {
    return null;
  }

  const insertion = findInsertionRange(prev, next);
  if (!insertion) return null;

  const caret = insertion.end;
  const beforeCaret = next.slice(0, caret);

  if (BULLET_TRIGGER.test(beforeCaret)) {
    const start = caret - 2; // "- ".length
    const text = next.slice(0, start) + '• ' + next.slice(caret);
    return { text, cursor: start + 2 };
  }

  if (ARROW_TRIGGER.test(beforeCaret)) {
    const start = caret - 2; // "->".length
    const text = next.slice(0, start) + '→' + next.slice(caret);
    return { text, cursor: start + 1 };
  }

  return null;
}
