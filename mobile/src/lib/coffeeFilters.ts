import { Coffee } from '@shared/lib/coffees';

export type SortMode = 'recent' | 'az';
export type SortDir = 'asc' | 'desc';
export type FilterKey = 'country' | 'process' | 'roast';

export type Filters = Record<FilterKey, string[]>;

export const EMPTY_FILTERS: Filters = { country: [], process: [], roast: [] };

export const FILTER_FIELD: Record<FilterKey, keyof Coffee> = {
  country: 'origin',
  process: 'process',
  roast: 'roastLevel',
};

export const FILTER_TITLE: Record<FilterKey, string> = {
  country: 'Country',
  process: 'Processing',
  roast: 'Roast',
};

export function filterOptions(coffees: Coffee[], key: FilterKey): string[] {
  const field = FILTER_FIELD[key];
  const all = coffees.map((c) => c[field]).filter((v): v is string => !!v);
  return [...new Set(all)].sort();
}

export function sortAndFilterCoffees(
  coffees: Coffee[],
  sortMode: SortMode,
  sortDir: SortDir,
  filters: Filters,
): Coffee[] {
  let result = [...coffees];

  if (sortMode === 'az') {
    result.sort((a, b) => (a.bean || '').localeCompare(b.bean || ''));
    if (sortDir === 'desc') result.reverse();
  } else if (sortDir === 'asc') {
    result.reverse();
  }

  if (filters.country.length) result = result.filter((c) => c.origin && filters.country.includes(c.origin));
  if (filters.process.length) result = result.filter((c) => c.process && filters.process.includes(c.process));
  if (filters.roast.length) result = result.filter((c) => c.roastLevel && filters.roast.includes(c.roastLevel));

  return result;
}
