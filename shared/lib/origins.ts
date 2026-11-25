// The one list of coffee origin countries the app knows about. It holds only
// the countries already used in the Notion "Country" column — add a row here
// (and in web/api/_origins.js) when a new country shows up.
//
// `coords` is a country-level fallback [lat, lng]. Beans with a region get a
// region-level location from geocoding instead (see mobile/src/lib/geocode.ts).

export interface OriginCountry {
  /** Flag emoji shown before the country name. */
  flag: string;
  /** ISO 3166-1 alpha-2 code, lowercase — scopes region geocoding to the country. */
  iso: string;
  /** Country-level map location, [lat, lng]. */
  coords: [number, number];
}

export const ORIGINS: Record<string, OriginCountry> = {
  Bolivia: { flag: '🇧🇴', iso: 'bo', coords: [-16.3, -63.6] },
  Brazil: { flag: '🇧🇷', iso: 'br', coords: [-14.2, -51.9] },
  Colombia: { flag: '🇨🇴', iso: 'co', coords: [4.5, -74.3] },
  'Costa Rica': { flag: '🇨🇷', iso: 'cr', coords: [9.7, -83.8] },
  Ethiopia: { flag: '🇪🇹', iso: 'et', coords: [8.6, 39.6] },
  Guatemala: { flag: '🇬🇹', iso: 'gt', coords: [15.5, -90.2] },
  Honduras: { flag: '🇭🇳', iso: 'hn', coords: [15.2, -86.2] },
  India: { flag: '🇮🇳', iso: 'in', coords: [20.6, 78.9] },
  Kenya: { flag: '🇰🇪', iso: 'ke', coords: [0.0, 37.9] },
  Panama: { flag: '🇵🇦', iso: 'pa', coords: [8.9, -79.5] },
  Peru: { flag: '🇵🇪', iso: 'pe', coords: [-9.2, -75.0] },
  Rwanda: { flag: '🇷🇼', iso: 'rw', coords: [-1.9, 29.9] },
  Yemen: { flag: '🇾🇪', iso: 'ye', coords: [15.5, 48.5] },
};

/** Country name → flag emoji, for components that look flags up by key. */
export const ORIGIN_FLAGS: Record<string, string> = Object.fromEntries(
  Object.entries(ORIGINS).map(([name, o]) => [name, o.flag]),
);

/** Flag emoji for a country, or '' when it isn't in the list. */
export function flagFor(country?: string | null): string {
  return (country && ORIGINS[country]?.flag) || '';
}

/** "🇮🇳 India" — the flag before the name, or just the name with no known flag. */
export function withFlag(country?: string | null): string {
  if (!country) return '';
  const flag = flagFor(country);
  return flag ? `${flag} ${country}` : country;
}
