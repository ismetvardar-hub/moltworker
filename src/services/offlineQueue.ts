/**
 * AŞAMA 14 — Offline işlem kuyruğu (localStorage).
 * Ağ gelince WhatsApp / görev flush edilir.
 */

import { sendWhatsApp } from './whatsapp';

const KEY = 'likya-offline-queue-v1';

export type OfflineJob =
  | {
      id: string;
      kind: 'whatsapp';
      createdAt: string;
      payload: {
        to?: string;
        body: string;
        guest?: string;
        orderId?: number;
        kind?: 'ready' | 'thermal' | 'custom';
      };
    }
  | {
      id: string;
      kind: 'crew-task';
      createdAt: string;
      payload: { taskId: number; done: boolean; label: string };
    };

function read(): OfflineJob[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(jobs: OfflineJob[]) {
  localStorage.setItem(KEY, JSON.stringify(jobs.slice(0, 100)));
}

export function listOfflineJobs(): OfflineJob[] {
  return read();
}

export function enqueueOffline(job: Omit<OfflineJob, 'id' | 'createdAt'> & { id?: string }): OfflineJob {
  const full = {
    ...job,
    id: job.id || `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  } as OfflineJob;
  write([full, ...read()]);
  return full;
}

export function clearOfflineJobs() {
  localStorage.removeItem(KEY);
}

export async function flushOfflineQueue(): Promise<{
  sent: number;
  failed: number;
  remaining: number;
}> {
  const jobs = read();
  const left: OfflineJob[] = [];
  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      if (job.kind === 'whatsapp') {
        await sendWhatsApp(job.payload);
        sent += 1;
      } else if (job.kind === 'crew-task') {
        // görevler yerel; flush yalnızca kuyruktan düşürür
        sent += 1;
      } else {
        left.push(job);
      }
    } catch {
      failed += 1;
      left.push(job);
    }
  }
  write(left);
  return { sent, failed, remaining: left.length };
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
