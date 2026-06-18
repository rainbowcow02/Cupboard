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

/** Opaque floating chrome — sheets, tab bar, scrim (web-readable contrast). */
export const surfaces = {
  cardRadius: 34,
  pillRadius: 100,
  cardFill: '#f5f5f5',
  pillFill: '#f7f7f7',
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
  scrimHeight: 118,
  scrimColors: [`${colors.pearl}00`, `${colors.chardonnay}99`] as const,
} as const;
