import Constants from 'expo-constants';
import { coffeeId, Cup } from '@shared/lib/coffees';

const BASE = (Constants.expoConfig?.extra?.apiUrl as string) ?? '';

/** An API failure that keeps the HTTP status, so callers can tell a retryable error apart. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError((body as { error?: string }).error ?? `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

/**
 * A partial cup update. A key that is left out stays untouched in Notion; a key
 * set to `null` clears that column. (The server treats '' / undefined as "leave
 * it alone", so a deleted value must be sent as `null` to actually save.)
 */
export type CupPatch = { [K in keyof Omit<Cup, 'id'>]?: Cup[K] | null };

/**
 * Notion rejects commas in single-choice (select) option names — and the Country
 * column is written as one option name — so a comma there fails the whole save.
 * Region and Variety are multi-selects where commas split values, so they're fine.
 */
const COMMA_FREE_FIELDS: Partial<Record<keyof Cup, string>> = {
  roaster: 'Roaster',
  origin: 'Country',
  process: 'Process',
  roastLevel: 'Roast',
  brewer: 'Brewer',
  grinder: 'Grinder',
  filter: 'Filter',
  grind: 'Grind size',
};

/** A friendly error for the first comma-containing select value, or null if all are valid. */
export function commaFieldError(fields: CupPatch): string | null {
  for (const [field, label] of Object.entries(COMMA_FREE_FIELDS)) {
    const value = fields[field as keyof CupPatch];
    if (typeof value === 'string' && value.includes(',')) {
      return `${label} can’t contain a comma (Notion doesn’t allow it). Edit “${value}” and try again.`;
    }
  }
  return null;
}

function assertNoCommaFields(fields: CupPatch) {
  const error = commaFieldError(fields);
  if (error) throw new Error(error);
}

export async function fetchCups(): Promise<Cup[]> {
  const data = await request<{ cups: Cup[] }>('/api/cups');
  return data.cups;
}

export async function createCup(cup: CupPatch): Promise<Cup> {
  assertNoCommaFields(cup);
  const data = await request<{ cup: Cup }>('/api/cups', {
    method: 'POST',
    body: JSON.stringify(cup),
  });
  return data.cup;
}

export async function updateCup(id: string, fields: CupPatch): Promise<Cup> {
  assertNoCommaFields(fields);
  const data = await request<{ cup: Cup }>(`/api/cups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
  return data.cup;
}

export async function deleteCup(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/cups/${id}`, { method: 'DELETE' });
}

/** Bean-identity + detail fields, duplicated across every cup of a coffee. */
export type BeanDetails = { bean: string; roaster: string } & Pick<
  CupPatch,
  'origin' | 'process' | 'roastLevel' | 'region' | 'variety' | 'altitude' | 'notes'
>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(e: unknown): boolean {
  // 429 = Notion rate limit; 5xx = a transient Notion/API failure; no status = network.
  if (e instanceof ApiError) return e.status === 429 || e.status >= 500;
  return true;
}

/** Updates one cup, retrying rate-limit / transient failures with backoff. */
async function updateCupWithRetry(id: string, fields: CupPatch): Promise<Cup> {
  const delays = [800, 1600, 3200];
  for (let attempt = 0; ; attempt++) {
    try {
      return await updateCup(id, fields);
    } catch (e) {
      if (attempt >= delays.length || !isRetryable(e)) throw e;
      await sleep(delays[attempt]);
    }
  }
}

/** True when the cup already holds every value in `fields` (null/'' count as empty). */
function cupMatches(cup: Cup, fields: CupPatch): boolean {
  return Object.entries(fields).every(([key, value]) => {
    const current = cup[key as keyof Cup];
    const norm = (v: unknown) => (v == null ? '' : String(v).trim());
    return norm(current) === norm(value);
  });
}

/** Thrown when only some of a bean's cups were updated; carries the ones that saved. */
export class PartialBeanUpdateError extends Error {
  updated: Cup[];
  constructor(updated: Cup[], total: number) {
    super(`Updated ${updated.length} of ${total} cups. Tap Save to retry the rest.`);
    this.updated = updated;
  }
}

/** Notion allows ~3 requests/second, so bean-wide edits run a few at a time. */
const BEAN_UPDATE_CONCURRENCY = 2;

/**
 * Bean details live on every cup row, so editing them PATCHes each cup belonging
 * to the coffee. Cups that already match are skipped, which also makes a retry
 * after a partial failure only touch the cups that didn't save. Returns the
 * coffee's new id (changing bean/roaster changes the derived id) and the
 * updated cup rows so the UI can show them without waiting on a refetch.
 */
export async function updateBeanDetails(
  id: string,
  fields: BeanDetails,
): Promise<{ id: string; cups: Cup[] }> {
  assertNoCommaFields(fields);
  const cups = await fetchCups();
  const targets = cups.filter((c) => coffeeId(c.bean, c.roaster) === id && !cupMatches(c, fields));

  const updated: Cup[] = [];
  let failed = 0;
  let firstError: unknown = null;
  let next = 0;
  const worker = async () => {
    while (next < targets.length) {
      const cup = targets[next++];
      try {
        updated.push(await updateCupWithRetry(String(cup.id), fields));
      } catch (e) {
        failed += 1;
        firstError ??= e;
      }
    }
  };
  await Promise.all(Array.from({ length: BEAN_UPDATE_CONCURRENCY }, worker));

  if (failed > 0) {
    if (updated.length === 0) throw firstError;
    throw new PartialBeanUpdateError(updated, targets.length);
  }
  return { id: coffeeId(fields.bean, fields.roaster), cups: updated };
}

/** Bean details auto-extracted from a roaster URL (all fields optional). */
export interface ExtractedBean {
  bean?: string;
  roaster?: string;
  origin?: string;
  region?: string;
  process?: string;
  roastLevel?: string;
  variety?: string;
  altitude?: string;
  notes?: string;
}

export async function extractBean(url: string): Promise<ExtractedBean> {
  const data = await request<{ bean: ExtractedBean }>('/api/extract-bean', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return data.bean;
}
