import { authHeaders } from './auth';

export interface MetricsReport {
  generatedAt: string;
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
  };
  integrations: {
    whatsappTotal: number;
    whatsappLive: number;
    whatsappMock: number;
    nexusEvents: number;
    auditEvents: number;
  };
  venues: { total: number; active: number };
}

export async function fetchMetrics(): Promise<MetricsReport> {
  const res = await fetch('/api/metrics', { headers: authHeaders() });
  if (!res.ok) throw new Error('Metrikler alınamadı');
  return (await res.json()) as MetricsReport;
}
