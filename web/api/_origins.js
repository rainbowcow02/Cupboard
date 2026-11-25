// Server copy of the origin-country list in shared/lib/origins.ts (the API
// can't import the app's TypeScript). Keep the two in sync: same countries,
// same flags. Only countries already in the Notion "Country" column belong here.
export const COUNTRY_FLAGS = {
  Bolivia: '🇧🇴', Brazil: '🇧🇷', Colombia: '🇨🇴', 'Costa Rica': '🇨🇷',
  Ethiopia: '🇪🇹', Guatemala: '🇬🇹', Honduras: '🇭🇳', India: '🇮🇳',
  Kenya: '🇰🇪', Panama: '🇵🇦', Peru: '🇵🇪', Rwanda: '🇷🇼', Yemen: '🇾🇪',
};

const BY_LOWER = Object.fromEntries(Object.keys(COUNTRY_FLAGS).map((n) => [n.toLowerCase(), n]));

/**
 * Tidy an extracted country into the name the app keys on: drop any flag
 * emoji, a "Republic of" style prefix, or a "Region, Country" lead-in, and
 * match known countries case-insensitively ("INDIA" → "India"). Unknown
 * countries pass through trimmed.
 */
export function normalizeCountry(raw) {
  if (!raw) return raw;
  let name = String(raw)
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const lastPart = name.split(',').pop().trim();
  const candidates = [
    name,
    lastPart,
    name.replace(/^(the\s+)?((federal|democratic|people'?s|united)\s+)*republic of\s+/i, ''),
  ];
  for (const c of candidates) {
    const known = BY_LOWER[c.toLowerCase()];
    if (known) return known;
  }
  return name;
}

/** "🇮🇳 India" — the Notion option name for a country. */
export function countryOptionName(country) {
  const flag = COUNTRY_FLAGS[country];
  return flag ? `${flag} ${country}` : country;
}
