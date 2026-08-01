import { authHeaders } from './auth';
import type { ArchiveEntry } from './archive';

export interface HubSummary {
  archiveCount: number;
  whatsappCount: number;
  nexusEventCount: number;
  recentArchive: ArchiveEntry[];
  recentWhatsapp: Array<{
    id: string;
    guest?: string;
    body: string;
    provider: string;
    status: string;
    at: string;
  }>;
  recentNexus: Array<{
    id: string;
    at: string;
    deviceId: string;
    action: string;
    detail: string;
  }>;
  agentHits: Array<{ agent: string; count: number }>;
  generatedAt: string;
}

export async function fetchHubSummary(): Promise<HubSummary> {
  const res = await fetch('/api/hub/summary', { headers: authHeaders() });
  if (!res.ok) throw new Error('Hub özeti alınamadı');
  return (await res.json()) as HubSummary;
}

export async function syncArchiveToServer(entry: ArchiveEntry): Promise<void> {
  await fetch('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(entry),
  }).catch(() => undefined);
}

export async function fetchServerArchive(): Promise<ArchiveEntry[]> {
  const res = await fetch('/api/archive', { headers: authHeaders() });
  if (!res.ok) return [];
  const data = (await res.json()) as { entries: ArchiveEntry[] };
  return data.entries ?? [];
}
