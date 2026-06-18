import { Brew, formatDate, parseRecipe } from '@shared/lib/coffees';

export function brewRatioLabel(brew: Brew): string | null {
  if (brew.beansG && brew.waterMl) {
    return `1:${(brew.waterMl / brew.beansG).toFixed(1)}`;
  }
  return null;
}

export function brewSummaryLine(brew: Brew): string {
  const parts: string[] = [];
  if (brew.brewer) parts.push(brew.brewer);
  const ratio = brewRatioLabel(brew);
  if (ratio) parts.push(ratio);
  if (brew.grind) parts.push(`grind ${brew.grind}`);
  if (brew.tempC != null) parts.push(`${brew.tempC}°C`);
  return parts.join(' · ') || 'Brew recipe';
}

export function brewRecipeHint(brew: Brew): string | null {
  const parsed = parseRecipe(brew.recipeToTest);
  if (parsed?.pours.length) {
    const pourCount = parsed.pours.length;
    return `${pourCount} pour step${pourCount === 1 ? '' : 's'}`;
  }
  if (brew.recipeToTest?.trim()) return 'Custom pour notes';
  return null;
}

export function brewPickerSubtitle(brew: Brew): string {
  const summary = brewSummaryLine(brew);
  const hint = brewRecipeHint(brew);
  const date = formatDate(brew.date);
  if (hint) return `${summary} · ${hint} · ${date}`;
  return `${summary} · ${date}`;
}
