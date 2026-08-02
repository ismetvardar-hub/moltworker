import { authHeaders } from './auth';

export interface AppNotification {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  level: string;
  read: boolean;
  meta?: Record<string, unknown>;
}

export async function fetchNotifications(opts?: {
  unread?: boolean;
  limit?: number;
}): Promise<{ unread: number; notifications: AppNotification[] }> {
  const qs = new URLSearchParams();
  if (opts?.unread) qs.set('unread', '1');
  if (opts?.limit) qs.set('limit', String(opts.limit));
  const url = qs.toString() ? `/api/notifications?${qs}` : '/api/notifications';
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Bildirimler alınamadı');
  return (await res.json()) as { unread: number; notifications: AppNotification[] };
}

export async function markNotificationRead(id: string): Promise<number> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('İşaretlenemedi');
  const data = (await res.json()) as { unread: number };
  return data.unread;
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
    headers: authHeaders(),
  });
}

export async function runNotificationsSweep(body: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch('/api/notifications/sweep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Bildirim sweep başarısız');
  return res.json();
}

export async function ackNotificationsFlag(body: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch('/api/notifications/flag/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Bildirim flag ack başarısız');
  return res.json();
}

export async function pushSeedNotification(body: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch('/api/notifications/push-seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Seed bildirim gönderilemedi');
  return res.json();
}
