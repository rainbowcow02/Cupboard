import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cup } from '@shared/lib/coffees';

const KEY = 'cups_v1';
const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  cups: Cup[];
  savedAt: number;
}

export async function loadCached(): Promise<Cup[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return entry.cups;
  } catch {
    return null;
  }
}

export async function isCacheStale(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return true;
    const entry: CacheEntry = JSON.parse(raw);
    return Date.now() - entry.savedAt > TTL_MS;
  } catch {
    return true;
  }
}

export async function saveCached(cups: Cup[]): Promise<void> {
  const entry: CacheEntry = { cups, savedAt: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(entry));
}
