import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ORIGINS } from '@shared/lib/origins';

/** [lat, lng] — the same order as `ORIGINS[...].coords`. */
export type LatLng = [number, number];

export interface OriginLocation {
  coords: LatLng;
  /** Whether `coords` points at the bean's region or only its country. */
  level: 'region' | 'country';
}

const STORAGE_KEY = 'origin_geo_v1';
const GEOCODE_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const REGION_TYPES = 'region,district,place,locality';

// query key → coords, or null for "looked it up, no trustworthy match".
// Network failures are never stored, so they retry next time.
const memory = new Map<string, LatLng | null>();
const inflight = new Map<string, Promise<LatLng | null>>();
let hydrated: Promise<void> | null = null;

function hydrate(): Promise<void> {
  if (!hydrated) {
    hydrated = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: Record<string, LatLng | null> = JSON.parse(raw);
        for (const [k, v] of Object.entries(saved)) if (!memory.has(k)) memory.set(k, v);
      })
      .catch(() => {});
  }
  return hydrated;
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(memory))).catch(() => {});
}

function words(s: string): string[] {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
}

// Geocoding always returns *something*, even for names it doesn't know
// ("Baba Budangiri" → a village in the wrong state). Only trust a match whose
// name shares a word stem with what we asked for. Comparing 4-letter stems
// tolerates spelling variants like "Chikmagalur" → "Chikkamagaluru".
function resembles(query: string, matched: string): boolean {
  const asked = words(query);
  const got = words(matched);
  return asked.some((a) => {
    const stem = a.slice(0, 4);
    return got.some((g) => (a.length < 4 ? g === a : g.startsWith(stem)));
  });
}

interface GeocodeFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: { name?: string; full_address?: string };
}

async function fetchCoords(query: string, iso: string | undefined, types: string): Promise<LatLng | null> {
  const token: string = Constants.expoConfig?.extra?.mapboxToken ?? '';
  if (!token) return null;
  const params = new URLSearchParams({ q: query, types, limit: '1', access_token: token });
  if (iso) params.set('country', iso);
  const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Geocoding failed (HTTP ${res.status})`);
  const data: { features?: GeocodeFeature[] } = await res.json();
  const feature = data.features?.[0];
  const lngLat = feature?.geometry?.coordinates;
  if (!feature || !lngLat) return null;
  const matched = `${feature.properties?.name ?? ''} ${feature.properties?.full_address ?? ''}`;
  if (!resembles(query, matched)) return null;
  return [lngLat[1], lngLat[0]];
}

/** Cached lookup: memory → device storage → Mapbox. */
async function lookup(key: string, query: string, iso: string | undefined, types: string): Promise<LatLng | null> {
  await hydrate();
  if (memory.has(key)) return memory.get(key) ?? null;
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = fetchCoords(query, iso, types)
    .then((coords) => {
      memory.set(key, coords);
      persist();
      return coords;
    })
    .catch(() => null)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

function regionKey(country: string, region: string) {
  return `r:${country}|${region}`.toLowerCase();
}

function countryKey(country: string) {
  return `c:${country}`.toLowerCase();
}

/** The best location we can produce without a network call. */
function locationNow(country?: string | null, region?: string | null): OriginLocation | null {
  const c = country?.trim();
  const r = region?.trim();
  if (c && r) {
    const cached = memory.get(regionKey(c, r));
    if (cached) return { coords: cached, level: 'region' };
  }
  if (c) {
    const known = ORIGINS[c]?.coords ?? memory.get(countryKey(c));
    if (known) return { coords: known, level: 'country' };
  }
  return null;
}

/** Region-level location when it can be found, otherwise the country's. */
export async function resolveOriginLocation(
  country?: string | null,
  region?: string | null,
): Promise<OriginLocation | null> {
  const c = country?.trim();
  const r = region?.trim();
  if (!c) return null;
  const iso = ORIGINS[c]?.iso;

  if (r) {
    // Without a known ISO code, name the country in the query instead.
    const query = iso ? r : `${r}, ${c}`;
    const coords = await lookup(regionKey(c, r), query, iso, REGION_TYPES);
    if (coords) return { coords, level: 'region' };
  }
  return resolveCountryLocation(c);
}

/** Country-level location: the static list first, geocoding for anything else. */
export async function resolveCountryLocation(country: string): Promise<OriginLocation | null> {
  const known = ORIGINS[country]?.coords;
  if (known) return { coords: known, level: 'country' };
  const coords = await lookup(countryKey(country), country, undefined, 'country');
  return coords ? { coords, level: 'country' } : null;
}

/** Location for a bean's mini-map: region when found, else country. */
export function useOriginLocation(country?: string | null, region?: string | null): OriginLocation | null {
  const [location, setLocation] = useState(() => locationNow(country, region));
  useEffect(() => {
    let cancelled = false;
    setLocation(locationNow(country, region));
    resolveOriginLocation(country, region).then((loc) => {
      if (!cancelled) setLocation(loc);
    });
    return () => {
      cancelled = true;
    };
  }, [country, region]);
  return location;
}

/** Key for one bean's (country, region) pair in `useOriginLocations`. */
export function originKey(country: string, region?: string | null): string {
  return `${country.trim()}|${region?.trim() ?? ''}`;
}

/**
 * Locations for many beans at once (the Explore globe), keyed by `originKey`.
 * A bean with a region is left out until its lookup settles, so its pin
 * appears once in the right place instead of jumping from the country center.
 */
export function useOriginLocations(
  pairs: { country: string; region?: string | null }[],
): Record<string, OriginLocation> {
  const keys = [...new Set(pairs.map((p) => originKey(p.country, p.region)))].sort();
  const keyString = keys.join('\n');
  const list = useMemo(
    () => (keyString ? keyString.split('\n') : []).map((k) => {
      const [country, region] = k.split('|');
      return { key: k, country, region };
    }),
    [keyString],
  );

  const initial = useCallback(() => {
    const out: Record<string, OriginLocation> = {};
    for (const { key, country, region } of list) {
      const now = locationNow(country, region);
      if (now && (now.level === 'region' || !region)) out[key] = now;
    }
    return out;
  }, [list]);

  const [resolved, setResolved] = useState<Record<string, OriginLocation>>(initial);

  useEffect(() => {
    let cancelled = false;
    setResolved(initial());
    for (const { key, country, region } of list) {
      resolveOriginLocation(country, region).then((loc) => {
        if (cancelled || !loc) return;
        setResolved((prev) => {
          const cur = prev[key];
          if (cur && cur.level === loc.level && cur.coords[0] === loc.coords[0] && cur.coords[1] === loc.coords[1]) {
            return prev;
          }
          return { ...prev, [key]: loc };
        });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [list, initial]);

  return resolved;
}
