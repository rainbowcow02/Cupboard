import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { groupIntoCoffees, sampleCoffees, Coffee, Cup } from '@shared/lib/coffees';
import { fetchCups } from '../lib/api';
import { loadCached, isCacheStale, saveCached } from '../lib/cache';

export interface CoffeesState {
  coffees: Coffee[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export const CoffeesContext = createContext<CoffeesState>({
  coffees: [],
  loading: true,
  refresh: async () => {},
});

export function useCoffees(): CoffeesState {
  return useContext(CoffeesContext);
}

export function useCoffeesProvider(): CoffeesState {
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshing = useRef(false);

  const loadFromNetwork = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const cups = await fetchCups();
      await saveCached(cups);
      setCoffees(groupIntoCoffees(cups));
    } catch {
      // network failed — keep whatever is already displayed
    } finally {
      refreshing.current = false;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadFromNetwork();
    setLoading(false);
  }, [loadFromNetwork]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const cached = await loadCached();
      if (cancelled) return;

      if (cached && cached.length > 0) {
        // Serve cache immediately, then refresh in background
        setCoffees(groupIntoCoffees(cached));
        setLoading(false);
        const stale = await isCacheStale();
        if (!cancelled && stale) loadFromNetwork();
      } else {
        // No cache — show sample data while fetching
        setCoffees(sampleCoffees());
        setLoading(true);
        await loadFromNetwork();
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [loadFromNetwork]);

  return { coffees, loading, refresh };
}
