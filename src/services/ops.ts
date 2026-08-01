import { authHeaders } from './auth';

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  uptimeSec: number;
  generatedAt: string;
  checks: Record<string, unknown>;
  campus?: {
    status?: string;
    score?: number;
    alerts?: number;
    warns?: number;
    actions?: Array<{ level?: string; text?: string; href?: string }>;
  };
}

export async function fetchCampusHealth(): Promise<NonNullable<HealthReport['campus']>> {
  const res = await fetch('/api/campus/health', { headers: authHeaders() });
  if (!res.ok) throw new Error('Kampüs health alınamadı');
  return (await res.json()) as NonNullable<HealthReport['campus']>;
}

export async function fetchHealth(): Promise<HealthReport> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Health alınamadı');
  return (await res.json()) as HealthReport;
}

export async function fetchDataFiles(): Promise<
  Array<{ name: string; bytes: number; mtime: string }>
> {
  const res = await fetch('/api/ops/files', { headers: authHeaders() });
  if (!res.ok) throw new Error('Dosya listesi alınamadı');
  const data = (await res.json()) as {
    files: Array<{ name: string; bytes: number; mtime: string }>;
  };
  return data.files;
}

export async function downloadBackup(): Promise<void> {
  const res = await fetch('/api/ops/backup', { headers: authHeaders() });
  if (!res.ok) throw new Error('Yedek alınamadı');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `likya-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreBackup(payload: unknown): Promise<{
  ok: boolean;
  restored: string[];
}> {
  const res = await fetch('/api/ops/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Geri yükleme başarısız');
  }
  return (await res.json()) as { ok: boolean; restored: string[] };
}
