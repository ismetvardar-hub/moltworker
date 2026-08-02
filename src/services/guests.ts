import { authHeaders } from './auth';

export interface Guest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  passId: string | null;
  tier: string | null;
  brandIds: string[];
  tags: string[];
  notes: string;
  createdAt: string;
  source?: string;
}

export interface GuestTimelineItem {
  at: string;
  kind: string;
  title: string;
  detail: string;
  meta?: Record<string, unknown>;
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data;
}

async function post(path: string, body: Record<string, unknown> = {}) {
  return parse(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function fetchGuests(): Promise<{
  total: number;
  withPass: number;
  withPhone: number;
  guests: Guest[];
  summary?: Record<string, unknown>;
  flags?: unknown[];
  title?: string;
}> {
  return parse(await fetch('/api/guests', { headers: authHeaders() }));
}

export async function syncGuests(): Promise<void> {
  await fetch('/api/guests/sync', { method: 'POST', headers: authHeaders() });
}

export async function createGuest(input: Partial<Guest>): Promise<Guest> {
  const data = await parse<{ guest: Guest }>(
    await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  );
  return data.guest;
}

export async function fetchGuestTimeline(id: string): Promise<{
  guest: Guest;
  timeline: GuestTimelineItem[];
  counts: { whatsapp: number; access: number };
}> {
  return parse(await fetch(`/api/guests/${id}/timeline`, { headers: authHeaders() }));
}

export async function runGuestsSweep(body: Record<string, unknown> = {}) {
  return post('/api/guests/sweep', body);
}

export async function ackGuestsFlag(body: Record<string, unknown> = {}) {
  return post('/api/guests/flag/ack', body);
}

export async function upsertGuestOps(body: Record<string, unknown> = {}) {
  return post('/api/guests/upsert', body);
}

export async function syncGuestsOps(body: Record<string, unknown> = {}) {
  return post('/api/guests/sync/ops', body);
}
