// Structured "Smell/Taste" and "Thoughts/To Try" parsing + serialization for the
// tastingNotes/brewNotes free-text columns. Shared between the recipe entry form
// (which writes these markers so a user never has to type them) and BrewCard
// (which parses them back out for display) so the grammar can't drift apart.

export interface TastingNotesParts {
  smell: string;
  taste: string;
  /** True when the text predates the Smell:/Taste: structure and couldn't be split. */
  raw: boolean;
}

export function parseTastingNotes(text: string | null | undefined): TastingNotesParts {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return { smell: '', taste: '', raw: false };

  const smellMatch = trimmed.match(/Smell:\s*([\s\S]*?)(?=Taste:|$)/i);
  const tasteMatch = trimmed.match(/Taste:\s*([\s\S]*)/i);
  if (!smellMatch && !tasteMatch) {
    return { smell: '', taste: trimmed, raw: true };
  }
  return {
    smell: smellMatch?.[1]?.trim() ?? '',
    taste: tasteMatch?.[1]?.trim() ?? '',
    raw: false,
  };
}

export function serializeTastingNotes(smell: string, taste: string): string | undefined {
  const s = smell.trim();
  const t = taste.trim();
  if (!s && !t) return undefined;
  if (s && t) return `Smell: ${s}\n\nTaste: ${t}`;
  return s ? `Smell: ${s}` : `Taste: ${t}`;
}

export interface BrewNotesParts {
  thoughts: string;
  toTry: string;
}

export function parseBrewNotes(text: string | null | undefined): BrewNotesParts {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return { thoughts: '', toTry: '' };

  const thoughtsMatch = trimmed.match(/Thoughts:\s*([\s\S]*?)(?=To Try:|$)/i);
  const toTryMatch = trimmed.match(/To Try:\s*([\s\S]*)/i);
  if (!thoughtsMatch && !toTryMatch) {
    return { thoughts: trimmed, toTry: '' };
  }
  return {
    thoughts: thoughtsMatch?.[1]?.trim() ?? '',
    toTry: toTryMatch?.[1]?.trim() ?? '',
  };
}

export function serializeBrewNotes(thoughts: string, toTry: string): string | undefined {
  const th = thoughts.trim();
  const tt = toTry.trim();
  if (!th && !tt) return undefined;
  if (th && tt) return `Thoughts: ${th}\n\nTo Try: ${tt}`;
  return th ? `Thoughts: ${th}` : `To Try: ${tt}`;
}
