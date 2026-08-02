/**
 * AŞAMA 21 — Outbound webhook'lar (audit / pass / archive olayları).
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const DELIVERY_LOG = 'webhook-deliveries';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

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

function openWebhookFlags() {
  const flags = readCollection('webhooks-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

export function webhooksSummary() {
  const hooks = listWebhooks();
  const deliveries = listDeliveries(80);
  const failedDeliveries = deliveries.filter((d) => !d.ok).length;
  const activeHooks = hooks.filter((h) => h.active).length;
  const inactiveHooks = hooks.filter((h) => !h.active).length;
  const eventCount = new Set(hooks.flatMap((h) => h.events || [])).size;
  const flags = openWebhookFlags();
  return {
    title: 'LİKYA Webhook Ops',
    total: hooks.length,
    active: activeHooks,
    inactive: inactiveHooks,
    deliveries: deliveries.length,
    failedDeliveries,
    eventCount,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: hooks.length,
      active: activeHooks,
      inactive: inactiveHooks,
      deliveries: deliveries.length,
      failed_deliveries: failedDeliveries,
      events: eventCount,
    },
    summaryLines: [
      `Webhook ${hooks.length} kayıt · aktif ${activeHooks} · event ${eventCount}`,
      `Delivery ${deliveries.length} · hata ${failedDeliveries} · flag ${flags.length}`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

function addWebhooksFlag(candidate, actor = 'system') {
  const existing = readCollection('webhooks-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('whf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('webhooks-flags', list.slice(0, 200));
  return flag;
}

export function runWebhooksSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = webhooksSummary();
  const created = [];
  const candidates = [];
  if (force || overview.active === 0) {
    candidates.push({
      key: 'webhooks_active_zero',
      level: overview.active === 0 ? 'warn' : 'info',
      text: `Aktif webhook ${overview.active}`,
      domain: 'config',
    });
  }
  if (force || overview.failedDeliveries > 0) {
    candidates.push({
      key: 'webhooks_delivery_failures',
      level: overview.failedDeliveries > 0 ? 'alert' : 'info',
      text: `Webhook delivery hata ${overview.failedDeliveries}`,
      domain: 'delivery',
    });
  }
  if (force || (overview.total > 0 && overview.deliveries === 0)) {
    candidates.push({
      key: 'webhooks_delivery_gap',
      level: overview.total > 0 && overview.deliveries === 0 ? 'warn' : 'info',
      text: `Webhook delivery log ${overview.deliveries}`,
      domain: 'observability',
    });
  }
  for (const c of candidates) {
    const flag = addWebhooksFlag(c, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'NEXUS',
        title: `webhooks sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('whs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('webhooks-sweeps', sweep, 80);
  appendAudit({ actor, action: 'webhooks.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: webhooksSummary() };
}

export function ackWebhooksFlag(input = {}, actor = 'system') {
  const list = readCollection('webhooks-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('webhooks-flags', list);
  appendAudit({ actor, action: 'webhooks.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: webhooksSummary() };
}

export function seedWebhookHook(input = {}, actor = 'system') {
  const hook = createWebhook(
    {
      url: input.url || 'https://example.com/likya-ops-webhook',
      events: Array.isArray(input.events) ? input.events : ['campus.alert', 'archive.save'],
      secret: input.secret,
      active: input.active !== false,
    },
    actor,
  );
  appendAudit({ actor, action: 'webhooks.seed', detail: hook.url, meta: { id: hook.id } });
  return { ok: true, webhook: hook, overview: webhooksSummary() };
}

export function toggleWebhookActive(input = {}, actor = 'system') {
  const hooks = ensureHooks();
  if (!hooks.length) return { ok: false, error: 'Webhook yok' };
  const idx = hooks.findIndex((h) => h.id === input.id);
  const targetIdx = idx >= 0 ? idx : 0;
  hooks[targetIdx] = {
    ...hooks[targetIdx],
    active: input.active == null ? !hooks[targetIdx].active : input.active !== false,
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  writeCollection('webhooks', hooks);
  appendAudit({
    actor,
    action: 'webhooks.toggle',
    detail: `${hooks[targetIdx].url} → ${hooks[targetIdx].active ? 'active' : 'inactive'}`,
    meta: { id: hooks[targetIdx].id },
  });
  return { ok: true, webhook: hooks[targetIdx], overview: webhooksSummary() };
}

export function recordWebhookProbeDelivery(input = {}, actor = 'system') {
  const hooks = ensureHooks();
  const hook = hooks.find((h) => h.id === input.id || h.url === input.url) || hooks[0] || null;
  const status = Number(input.status ?? 202);
  const delivery = {
    id: rid('wd'),
    at: new Date().toISOString(),
    hookId: hook?.id || 'manual',
    url: hook?.url || input.url || 'https://example.com/likya-ops-webhook',
    event: input.event || 'ops.probe',
    status,
    ok: input.ok == null ? status >= 200 && status < 400 : input.ok !== false,
    error: input.error || null,
    actor,
  };
  prependItem(DELIVERY_LOG, delivery, 200);
  appendAudit({ actor, action: 'webhooks.probe', detail: `${delivery.event} → ${delivery.status}`, meta: { id: delivery.id } });
  return { ok: true, delivery, overview: webhooksSummary() };
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
