import { authHeaders } from './auth';

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data;
}

export interface EthosScore {
  score: number | null;
  passed: number;
  failed: number;
  missing: number;
  totalWithEthos: number;
  archiveSize: number;
  grade: string;
  masterRule: string;
  samples: Array<{ id: number; text: string; verdict: string; at: string }>;
}

export interface OpsReport {
  title: string;
  generatedAt: string;
  period: { from: string; to: string };
  counts: {
    archive: number;
    whatsapp: number;
    nexus: number;
    audit: number;
    jobs: number;
    jobsByStatus: Record<string, number>;
    settingsConfigured: number;
    settingsTotal: number;
  };
  ethos: EthosScore;
  topAgents: Array<{ agent: string; count: number }>;
  recentArchive: Array<{
    id: number;
    text: string;
    status: string;
    agents: string[];
    completedAt: string;
  }>;
  recentWhatsapp: Array<{
    id: string;
    body: string;
    provider: string;
    status: string;
    at: string;
  }>;
  recentAudit: Array<{
    id: string;
    at: string;
    actor: string;
    action: string;
    detail: string;
  }>;
  flags?: Array<{ id: string; key?: string; level?: string; text?: string; status?: string }>;
  summary?: {
    flags_open?: number;
    archive?: number;
    jobs_backlog?: number;
    ethos_grade?: string;
    ethos_failed?: number;
  };
  summaryLines?: string[];
}

export async function fetchOpsReport(): Promise<OpsReport> {
  return parse(await fetch('/api/report', { headers: authHeaders() }));
}

export async function runReportSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/report/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }));
}
export async function cancelReportJobs(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/report/jobs/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }));
}
export async function ackReportEthos(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/report/ethos/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }));
}
export async function snapshotReportAudit(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/report/audit/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }));
}
export async function ackReportFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/report/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }));
}

export async function downloadReport(format: 'json' | 'markdown'): Promise<void> {
  const res = await fetch(`/api/report?format=${format}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Rapor indirilemedi');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    format === 'markdown'
      ? `likya-rapor-${new Date().toISOString().slice(0, 10)}.md`
      : `likya-rapor-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
