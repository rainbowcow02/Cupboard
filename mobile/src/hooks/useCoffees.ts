import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { groupIntoCoffees, sampleCups, Coffee, Cup } from '@shared/lib/coffees';
import { fetchCups } from '../lib/api';
import { loadCached, isCacheStale, saveCached } from '../lib/cache';

export interface CoffeesState {
  coffees: Coffee[];
  loading: boolean;
  refresh: () => Promise<void>;
  /** Shows saved cup rows (from a create/update response) immediately. */
  applyCups: (cups: Cup[]) => void;
  /** Drops a deleted cup immediately. */
  removeCup: (id: Cup['id']) => void;
}

export const CoffeesContext = createContext<CoffeesState>({
  coffees: [],
  loading: true,
  refresh: async () => {},
  applyCups: () => {},
  removeCup: () => {},
});

export function useCoffees(): CoffeesState {
  return useContext(CoffeesContext);
}

/**
 * How long a local write wins over what the server returns. Notion's list query
 * can lag a few seconds behind an update, so a refetch right after a save may
 * still return the old row — without this the edit would flash back to its old
 * value until the next refresh.
 */
const LOCAL_WRITE_TTL_MS = 60 * 1000;

interface LocalWrite {
  /** The saved row, or null when the cup was deleted. */
  cup: Cup | null;
  at: number;
}

export function useCoffeesProvider(): CoffeesState {
  const [cups, setCups] = useState<Cup[]>([]);
  const [loading, setLoading] = useState(true);
  const localWrites = useRef(new Map<string, LocalWrite>());
  const inflight = useRef<Promise<void> | null>(null);
  const rerun = useRef(false);

  /** Layers recent local writes over server rows (see LOCAL_WRITE_TTL_MS). */
  const withLocalWrites = useCallback((rows: Cup[]): Cup[] => {
    const now = Date.now();
    const writes = localWrites.current;
    for (const [id, w] of writes) if (now - w.at > LOCAL_WRITE_TTL_MS) writes.delete(id);
    if (writes.size === 0) return rows;

    const seen = new Set<string>();
    const merged: Cup[] = [];
    for (const row of rows) {
      const key = String(row.id);
      seen.add(key);
      const w = writes.get(key);
      if (!w) merged.push(row);
      else if (w.cup) merged.push(w.cup);
    }
    // A just-created cup the lagging query doesn't return yet.
    for (const [id, w] of writes) if (w.cup && !seen.has(id)) merged.push(w.cup);
    return merged;
  }, []);

  const loadFromNetwork = useCallback((): Promise<void> => {
    // A fetch is already running: ask it to go round once more (so data saved
    // after it started is picked up) and hand back the same promise.
    if (inflight.current) {
      rerun.current = true;
      return inflight.current;
    }
    const run = (async () => {
      try {
        do {
          rerun.current = false;
          try {
            const fetched = await fetchCups();
            await saveCached(fetched);
            setCups(withLocalWrites(fetched));
          } catch {
            // network failed — keep whatever is already displayed
          }
        } while (rerun.current);
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = run;
    return run;
  }, [withLocalWrites]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadFromNetwork();
    setLoading(false);
  }, [loadFromNetwork]);

  const applyCups = useCallback((saved: Cup[]) => {
    if (saved.length === 0) return;
    const now = Date.now();
    for (const cup of saved) localWrites.current.set(String(cup.id), { cup, at: now });
    setCups((current) => {
      const byId = new Map(saved.map((c) => [String(c.id), c]));
      const next = current.map((c) => byId.get(String(c.id)) ?? c);
      const existing = new Set(current.map((c) => String(c.id)));
      for (const cup of saved) if (!existing.has(String(cup.id))) next.push(cup);
      saveCached(next).catch(() => {});
      return next;
    });
  }, []);

  const removeCup = useCallback((id: Cup['id']) => {
    localWrites.current.set(String(id), { cup: null, at: Date.now() });
    setCups((current) => {
      const next = current.filter((c) => String(c.id) !== String(id));
      saveCached(next).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const cached = await loadCached();
      if (cancelled) return;

      if (cached && cached.length > 0) {
        // Serve cache immediately, then refresh in background
        setCups(cached);
        setLoading(false);
        const stale = await isCacheStale();
        if (!cancelled && stale) loadFromNetwork();
      } else {
        // No cache — show sample data while fetching
        setCups(sampleCups);
        setLoading(true);
        await loadFromNetwork();
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [loadFromNetwork]);

  const coffees = useMemo(() => groupIntoCoffees(cups), [cups]);

  return { coffees, loading, refresh, applyCups, removeCup };
}
