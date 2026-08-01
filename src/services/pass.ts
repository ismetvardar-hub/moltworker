import { authHeaders } from './auth';
import type { PassTier } from '../types';

export interface PassHolderDto {
  id: string;
  name: string;
  tier: PassTier | string;
  zones: string[];
  gateIds: string[];
  venueIds: string[];
  active: boolean;
  lastEntryAt?: string | null;
  lastEntryGate?: string | null;
}

export interface PassGate {
  id: string;
  name: string;
  zone: string;
  venueId: string;
  venueName: string;
  deviceId: string;
}

export interface PassDecision {
  allowed: boolean;
  reason: string;
  code: string;
  gate: PassGate | null;
  holder: PassHolderDto | null;
}

export interface AccessEventDto {
  id: string;
  at: string;
  code: string;
  holderName: string;
  holderId: string | null;
  gateId: string | null;
  gateName: string;
  venueId: string | null;
  zone: string | null;
  allowed: boolean;
  reason: string;
  actor: string;
  nexusDeviceId: string | null;
}

export async function fetchPassHolders(): Promise<{
  holders: PassHolderDto[];
  stats: Record<string, number | null>;
}> {
  const res = await fetch('/api/pass/holders', { headers: authHeaders() });
  if (!res.ok) throw new Error('Kartlar alınamadı');
  return (await res.json()) as {
    holders: PassHolderDto[];
    stats: Record<string, number | null>;
  };
}

export async function fetchPassGates(): Promise<PassGate[]> {
  const res = await fetch('/api/pass/gates', { headers: authHeaders() });
  if (!res.ok) return [];
  const data = (await res.json()) as { gates: PassGate[] };
  return data.gates ?? [];
}

export async function fetchAccessEvents(limit = 40): Promise<AccessEventDto[]> {
  const res = await fetch(`/api/pass/events?limit=${limit}`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = (await res.json()) as { events: AccessEventDto[] };
  return data.events ?? [];
}

export async function verifyPass(code: string, gateId: string): Promise<PassDecision> {
  const res = await fetch('/api/pass/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code, gateId }),
  });
  if (!res.ok) throw new Error('Doğrulama başarısız');
  return (await res.json()) as PassDecision;
}

export async function admitPass(
  code: string,
  gateId: string,
): Promise<{ decision: PassDecision; event: AccessEventDto }> {
  const res = await fetch('/api/pass/admit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code, gateId }),
  });
  if (!res.ok) throw new Error('Geçiş kaydı başarısız');
  return (await res.json()) as { decision: PassDecision; event: AccessEventDto };
}
