import { authHeaders } from './auth';

export type JobKind = 'whatsapp.reminder' | 'directive.queue';
export type JobStatus =
  | 'scheduled'
  | 'running'
  | 'ready'
  | 'done'
  | 'failed'
  | 'cancelled';

export interface Job {
  id: string;
  kind: JobKind;
  status: JobStatus;
  title: string;
  payload: Record<string, unknown>;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  result: unknown;
  error: string | null;
}

export interface JobsSummary {
  total: number;
  byStatus: Record<string, number>;
  upcoming: Job[];
  readyDirectives: Job[];
  recent: Job[];
}

export async function fetchJobs(params?: {
  status?: string;
  kind?: string;
}): Promise<{ jobs: Job[]; summary: JobsSummary }> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.kind) qs.set('kind', params.kind);
  const url = qs.toString() ? `/api/jobs?${qs}` : '/api/jobs';
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Görevler alınamadı');
  return (await res.json()) as { jobs: Job[]; summary: JobsSummary };
}

export async function createJob(input: {
  kind: JobKind;
  title?: string;
  payload?: Record<string, unknown>;
  dueAt?: string;
}): Promise<Job> {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Görev oluşturulamadı');
  }
  const data = (await res.json()) as { job: Job };
  return data.job;
}

export async function runJobNow(id: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${id}/run`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Görev çalıştırılamadı');
  const data = (await res.json()) as { job: Job };
  return data.job;
}

export async function cancelJob(id: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${id}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Görev iptal edilemedi');
  const data = (await res.json()) as { job: Job };
  return data.job;
}
