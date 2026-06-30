import Constants from 'expo-constants';
import { Cup } from '@shared/lib/coffees';

const BASE = (Constants.expoConfig?.extra?.apiUrl as string) ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchCups(): Promise<Cup[]> {
  const data = await request<{ cups: Cup[] }>('/api/cups');
  return data.cups;
}

export async function createCup(cup: Partial<Cup>): Promise<Cup> {
  const data = await request<{ cup: Cup }>('/api/cups', {
    method: 'POST',
    body: JSON.stringify(cup),
  });
  return data.cup;
}

export async function updateCup(id: string, fields: Partial<Cup>): Promise<Cup> {
  const data = await request<{ cup: Cup }>(`/api/cups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
  return data.cup;
}

export async function deleteCup(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/cups/${id}`, { method: 'DELETE' });
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
