/**
 * AŞAMA 21 — Outbound webhook'lar (audit / pass / archive olayları).
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

const DELIVERY_LOG = 'webhook-deliveries';

function ensureHooks() {
  const list = readCollection('webhooks', null);
  if (!Array.isArray(list)) {
    writeCollection('webhooks', []);
    return [];
  }
  return list;
}

export function listWebhooks() {
  return ensureHooks();
}

export function createWebhook(input, actor = 'system') {
  const hook = {
    id: `wh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    url: String(input.url || '').trim(),
    events: Array.isArray(input.events) ? input.events : ['pass.admit', 'archive.save'],
    secret: input.secret || randomBytes(12).toString('hex'),
    active: input.active !== false,
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  if (!hook.url.startsWith('http://') && !hook.url.startsWith('https://')) {
    throw new Error('url http(s) ile başlamalı');
  }
  prependItem('webhooks', hook, 50);
  appendAudit({
    actor,
    action: 'webhooks.create',
    detail: hook.url,
    meta: { id: hook.id, events: hook.events },
  });
  return hook;
}

export function removeWebhook(id, actor = 'system') {
  const hook = ensureHooks().find((h) => h.id === id);
  if (!hook) return null;
  deleteItem('webhooks', id);
  appendAudit({
    actor,
    action: 'webhooks.delete',
    detail: hook.url,
    meta: { id },
  });
  return hook;
}

export function listDeliveries(limit = 40) {
  return readCollection(DELIVERY_LOG, []).slice(0, limit);
}

/**
 * Eşleşen aktif hook'lara POST at (fire-and-forget).
 */
export async function dispatchWebhooks(event, payload) {
  const hooks = ensureHooks().filter(
    (h) => h.active && (h.events.includes(event) || h.events.includes('*')),
  );
  const results = [];
  for (const hook of hooks) {
    const body = {
      event,
      at: new Date().toISOString(),
      data: payload,
    };
    let status = 0;
    let ok = false;
    let error = null;
    try {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Likya-Event': event,
          'X-Likya-Secret': hook.secret,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      status = res.status;
      ok = res.ok;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    const delivery = {
      id: `wd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
      at: new Date().toISOString(),
      hookId: hook.id,
      url: hook.url,
      event,
      status,
      ok,
      error,
    };
    prependItem(DELIVERY_LOG, delivery, 200);
    results.push(delivery);
  }
  return results;
}
