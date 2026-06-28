export const colors = {
  pearl: '#f9eddd',
  black: '#000000',
  moss: '#355c44',
  supremeBeige: '#cca68c',
  burgundy: '#5d0505',
  blossomPink: '#fc999b',
  chardonnay: '#fdcb88',
  greyDark: '#6b6b6b',
  greyLight: '#d9d9d9',
} as const;

export const fonts = {
  serif: 'DMSerifDisplay_400Regular',
  sans: 'Avenir',
  condensed: 'AvenirNextCondensed-Medium',
} as const;

/**
 * Cup rating pill backgrounds, keyed by rating (1–5).
 * Source of truth: Figma "cup rating badge" — each rating has its own tinted pill.
 */
export const cupRatingScale = {
  1: 'rgba(107,107,107,0.2)', // greyDark tint
  2: 'rgba(204,166,140,0.3)', // supremeBeige tint
  3: 'rgba(49,131,81,0.2)', // fern green tint
  4: 'rgba(252,153,155,0.4)', // blossomPink tint
  5: 'rgba(185,136,253,0.3)', // grape tint
} as const;

export type CupRatingValue = keyof typeof cupRatingScale;

/** Opaque floating chrome — sheets, tab bar, scrim (web-readable contrast). */
export const surfaces = {
  cardRadius: 34,
  pillRadius: 100,
  cardFill: '#f5f5f5',
  pillFill: '#ffffff',
  pillHairline: 'rgba(0,0,0,0.08)',
  divider: '#e7e7e7',
  clearButtonFill: 'rgba(120,120,128,0.16)',
  clearButtonText: colors.greyDark,
  grabberColor: '#ccc',
  grabberWidth: 36,
  grabberHeight: 5,
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 8,
  },
  scrimHeight: 160,
  scrimColors: [`${colors.pearl}00`, `${colors.chardonnay}d9`] as const,
} as const;
