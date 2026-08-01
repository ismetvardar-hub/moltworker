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

export async function fetchGuests(): Promise<{
  total: number;
  withPass: number;
  withPhone: number;
  guests: Guest[];
}> {
  const res = await fetch('/api/guests', { headers: authHeaders() });
  if (!res.ok) throw new Error('Misafirler alınamadı');
  return (await res.json()) as {
    total: number;
    withPass: number;
    withPhone: number;
    guests: Guest[];
  };
}

export async function syncGuests(): Promise<void> {
  await fetch('/api/guests/sync', { method: 'POST', headers: authHeaders() });
}

export async function createGuest(input: Partial<Guest>): Promise<Guest> {
  const res = await fetch('/api/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Misafir kaydı başarısız');
  const data = (await res.json()) as { guest: Guest };
  return data.guest;
}

export async function fetchGuestTimeline(id: string): Promise<{
  guest: Guest;
  timeline: GuestTimelineItem[];
  counts: { whatsapp: number; access: number };
}> {
  const res = await fetch(`/api/guests/${id}/timeline`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Zaman çizelgesi alınamadı');
  return (await res.json()) as {
    guest: Guest;
    timeline: GuestTimelineItem[];
    counts: { whatsapp: number; access: number };
  };
}
