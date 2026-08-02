import { authHeaders } from './auth';

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface WebhookDelivery {
  id: string;
  at: string;
  hookId: string;
  url: string;
  event: string;
  status: number;
  ok: boolean;
  error: string | null;
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function fetchWebhooks(): Promise<{
  webhooks: Webhook[];
  deliveries: WebhookDelivery[];
}> {
  const res = await fetch('/api/webhooks', { headers: authHeaders() });
  if (!res.ok) throw new Error('Webhook listesi alınamadı');
  return (await res.json()) as { webhooks: Webhook[]; deliveries: WebhookDelivery[] };
}

export async function createWebhook(input: {
  url: string;
  events?: string[];
  secret?: string;
}): Promise<Webhook> {
  const res = await fetch('/api/webhooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Webhook oluşturulamadı');
  }
  const data = (await res.json()) as { webhook: Webhook };
  return data.webhook;
}

export async function deleteWebhook(id: string): Promise<void> {
  const res = await fetch(`/api/webhooks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Silinemedi');
}

export async function runWebhooksSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/webhooks/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function ackWebhooksFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/webhooks/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function probeWebhookDelivery(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/webhooks/delivery/probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function toggleWebhookActive(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/webhooks/active/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}

export async function seedWebhookHook(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/webhooks/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  );
}
