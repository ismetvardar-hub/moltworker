import { authHeaders } from './auth';

export type JobKind = 'whatsapp.reminder' | 'directive.queue';
export type JobStatus =
  | 'scheduled'
  | 'running'
  | 'ready'
  | 'claimed'
  | 'queued'
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
  flags?: JobsFlag[];
  upcoming: Job[];
  readyDirectives: Job[];
  recent: Job[];
  summary?: Record<string, number>;
  summaryLines?: string[];
}

export interface JobsFlag {
  id: string;
  key: string;
  level: string;
  text: string;
  domain: string;
  status: string;
  at: string;
  actor?: string;
  jobIds?: string[];
}

export interface JobsOpsResponse {
  ok: boolean;
  error?: string;
  job?: Job;
  flag?: JobsFlag;
  cancelled?: string[];
  created?: JobsFlag[];
  overview?: JobsSummary;
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

async function postJobsOps(path: string, body: Record<string, unknown> = {}): Promise<JobsOpsResponse> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as JobsOpsResponse;
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function runJobsSweep(body: Record<string, unknown> = { force: true }): Promise<JobsOpsResponse> {
  return postJobsOps('/api/jobs/sweep', body);
}

export function ackJobsFlag(body: Record<string, unknown> = {}): Promise<JobsOpsResponse> {
  return postJobsOps('/api/jobs/flag/ack', body);
}

export function retryFailedJob(body: Record<string, unknown> = {}): Promise<JobsOpsResponse> {
  return postJobsOps('/api/jobs/failed/retry', body);
}

export function purgeFailedJobs(body: Record<string, unknown> = {}): Promise<JobsOpsResponse> {
  return postJobsOps('/api/jobs/failed/purge', body);
}

export function seedQueuedJob(body: Record<string, unknown> = {}): Promise<JobsOpsResponse> {
  return postJobsOps('/api/jobs/queued/seed', body);
}

export async function claimDirective(id: string): Promise<{ job: Job; text: string }> {
  const res = await fetch(`/api/jobs/${id}/claim`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Talimat alınamadı');
  }
  return (await res.json()) as { job: Job; text: string };
}

export async function fetchReadyDirectives(): Promise<Job[]> {
  const data = await fetchJobs({ kind: 'directive.queue', status: 'ready' });
  return data.jobs;
}
