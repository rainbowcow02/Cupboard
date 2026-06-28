import { Coffee } from '@shared/lib/coffees';

export type SortMode = 'recent' | 'az';
export type SortDir = 'asc' | 'desc';
export type FilterKey = 'country' | 'process' | 'roast' | 'roaster';

export type Filters = Record<FilterKey, string[]>;

export const EMPTY_FILTERS: Filters = { country: [], process: [], roast: [], roaster: [] };

export const FILTER_FIELD: Record<FilterKey, keyof Coffee> = {
  country: 'origin',
  process: 'process',
  roast: 'roastLevel',
  roaster: 'roaster',
};

export const FILTER_TITLE: Record<FilterKey, string> = {
  country: 'Country',
  process: 'Processing',
  roast: 'Roast',
  roaster: 'Roaster',
};

export function filterOptions(coffees: Coffee[], key: FilterKey): string[] {
  const field = FILTER_FIELD[key];
  const all = coffees.map((c) => c[field]).filter((v): v is string => !!v);
  return [...new Set(all)].sort();
}

export function applyFilters(coffees: Coffee[], filters: Filters): Coffee[] {
  let result = coffees;

  if (filters.country.length) result = result.filter((c) => c.origin && filters.country.includes(c.origin));
  if (filters.process.length) result = result.filter((c) => c.process && filters.process.includes(c.process));
  if (filters.roast.length) result = result.filter((c) => c.roastLevel && filters.roast.includes(c.roastLevel));
  if (filters.roaster.length) result = result.filter((c) => c.roaster && filters.roaster.includes(c.roaster));

  return result;
}

// Options for a pill, constrained to values that still yield results given the
// other active filters. The pill's own selection is dropped so toggling values
// within it never makes its own options vanish; currently-selected values are
// always included so they remain visible and deselectable.
export function availableFilterOptions(
  coffees: Coffee[],
  key: FilterKey,
  filters: Filters,
): string[] {
  const otherFilters = { ...filters, [key]: [] };
  const subset = applyFilters(coffees, otherFilters);
  const options = new Set(filterOptions(subset, key));
  filters[key].forEach((v) => options.add(v));
  return [...options].sort();
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

  return applyFilters(result, filters);
}
