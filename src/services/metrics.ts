import { authHeaders } from './auth';

export interface MetricsReport {
  generatedAt: string;
  title?: string;
  health: string;
  uptimeSec: number;
  sseClients: number;
  unreadNotifications: number;
  chain: {
    archiveTotal: number;
    archiveOk: number;
    archiveFail: number;
    successRate: number | null;
    stepsTotal: number;
    avgChainMs: number | null;
    ethosOk: number;
    ethosFail: number;
    topFailures: Array<{ agent: string; count: number }>;
  };
  pass: {
    holders: number;
    activeHolders: number;
    gates: number;
    events: number;
    allowed: number;
    denied: number;
    allowRate: number | null;
  };
  jobs: {
    total: number;
    byStatus: Record<string, number>;
    ready: number;
    scheduled: number;
    failed?: number;
    queued?: number;
  };
  integrations: {
    whatsappTotal: number;
    whatsappLive: number;
    whatsappMock: number;
    nexusEvents: number;
    auditEvents: number;
  };
  venues: { total: number; active: number };
  flags?: Array<{ id: string; key?: string; level?: string; text?: string; status?: string }>;
  summary?: Record<string, unknown>;
  summaryLines?: string[];
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data;
}

export async function fetchMetrics(): Promise<MetricsReport> {
  return parse(await fetch('/api/metrics', { headers: authHeaders() }));
}

export async function runMetricsSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/metrics/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function ackMetricsFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/metrics/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function snapshotMetrics(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/metrics/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function purgeFailedJobs(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/metrics/jobs/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function ackEthosFails(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/metrics/ethos/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}
