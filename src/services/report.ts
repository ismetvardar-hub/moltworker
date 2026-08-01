import { authHeaders } from './auth';

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
}

export async function fetchOpsReport(): Promise<OpsReport> {
  const res = await fetch('/api/report', { headers: authHeaders() });
  if (!res.ok) throw new Error('Rapor alınamadı');
  return (await res.json()) as OpsReport;
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
