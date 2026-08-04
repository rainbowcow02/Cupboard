import { parseRecipe } from '@shared/lib/coffees';

/** One row of the structured pour builder. Index 0 is always "Bloom"; the rest are P1, P2, … by position. */
export interface PourFormEntry {
  id: string;
  amount: string;
  note: string;
}

export interface PourFormState {
  pours: PourFormEntry[];
  note: string;
  brewTime: string;
}

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `pour-${nextId}`;
}

export function emptyPour(): PourFormEntry {
  return { id: makeId(), amount: '', note: '' };
}

/** Bloom + P1–P3: the shape a fresh brew's pour builder starts with. */
export function defaultPours(): PourFormEntry[] {
  return [emptyPour(), emptyPour(), emptyPour(), emptyPour()];
}

/** Step keyword ("Bloom"/"P1"/"P2"…) embedded in the serialized recipe text — must match `parseRecipe`'s grammar. */
export function pourLabel(index: number): string {
  return index === 0 ? 'Bloom' : `P${index}`;
}

/** Friendly on-screen row label ("Bloom"/"Pour 1"/"Pour 2"…). */
export function pourDisplayLabel(index: number): string {
  return index === 0 ? 'Bloom' : `Pour ${index}`;
}

/** Removes an embedded "Brew time: …" clause so it doesn't leak into the free-form pour note. */
function stripBrewTimeClause(text: string): string {
  return text
    .replace(/(?:•\s*)?brew\s*time[:\s]+[^\n(]{2,15}/i, '')
    .replace(/,\s*,/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim();
}

/**
 * Reconstructs the structured pour builder from a saved `recipeToTest` string.
 * Pours parsed from the free text land in their numbered slot (gaps for any
 * skipped step numbers); text that doesn't parse into any pours is kept
 * verbatim as the global note rather than silently dropped. Brew time is
 * extracted separately since it's entered as its own field.
 */
export function pourFormFromRecipeText(text: string | null | undefined): PourFormState {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return { pours: defaultPours(), note: '', brewTime: '' };

  const parsed = parseRecipe(trimmed);
  const brewTime = parsed?.brewTime?.replace(/\s*min\.?\s*$/i, '').trim() ?? '';

  if (!parsed || parsed.pours.length === 0) {
    return { pours: defaultPours(), note: stripBrewTimeClause(trimmed), brewTime };
  }

  let bloom: PourFormEntry = emptyPour();
  const numbered = new Map<number, PourFormEntry>();
  let maxStep = 3;
  for (const pour of parsed.pours) {
    if (pour.step === 'Bloom') {
      bloom = { id: makeId(), amount: pour.amount, note: pour.technique };
      continue;
    }
    const n = Number(pour.step.replace(/^P/i, ''));
    if (!Number.isFinite(n) || n < 1) continue;
    numbered.set(n, { id: makeId(), amount: pour.amount, note: pour.technique });
    if (n > maxStep) maxStep = n;
  }

  const pours = [bloom];
  for (let n = 1; n <= maxStep; n++) {
    pours.push(numbered.get(n) ?? emptyPour());
  }

  return { pours, note: stripBrewTimeClause(parsed.note ?? ''), brewTime };
}

/**
 * Serializes the structured pour builder (plus brew time) back into the
 * free-text grammar `parseRecipe` understands, so it still renders correctly
 * on the brew card and reads as a plain sentence directly in Notion.
 */
export function serializePourStructure(
  pours: PourFormEntry[],
  note: string,
  brewTime: string,
): string | undefined {
  const parts = pours
    .map((pour, index) => {
      const amount = pour.amount.trim();
      if (!amount) return null;
      const noteText = pour.note.trim();
      return `${pourLabel(index)} -> ${amount}${noteText ? ` ${noteText}` : ''}`;
    })
    .filter((part): part is string => part !== null);

  const trimmedNote = note.trim();
  const trimmedTime = brewTime.trim();

  const segments = [
    parts.length ? parts.join(', ') : '',
    trimmedNote,
    trimmedTime ? `Brew time: ${trimmedTime} min` : '',
  ].filter(Boolean);

  return segments.length ? segments.join(', ') : undefined;
}
