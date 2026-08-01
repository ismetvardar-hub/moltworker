import { authHeaders } from './auth';

export interface Venue {
  id: string;
  name: string;
  city: string;
  region: string;
  timezone: string;
  status: string;
  gates: string[];
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VenuesSummary {
  total: number;
  active: number;
  seasonal: number;
  venues: Venue[];
}

export async function fetchVenues(): Promise<VenuesSummary> {
  const res = await fetch('/api/venues', { headers: authHeaders() });
  if (!res.ok) throw new Error('Tesisler alınamadı');
  return (await res.json()) as VenuesSummary;
}

export async function createVenue(input: Partial<Venue>): Promise<Venue> {
  const res = await fetch('/api/venues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Tesis oluşturulamadı');
  }
  const data = (await res.json()) as { venue: Venue };
  return data.venue;
}

export async function updateVenue(id: string, patch: Partial<Venue>): Promise<Venue> {
  const res = await fetch(`/api/venues/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Tesis güncellenemedi');
  const data = (await res.json()) as { venue: Venue };
  return data.venue;
}

export async function deleteVenue(id: string): Promise<void> {
  const res = await fetch(`/api/venues/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Tesis silinemedi');
}
