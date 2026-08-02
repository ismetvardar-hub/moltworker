import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 177 - Flash report/deal ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('flash', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'fls_1',
      metric: "Doluluk",
      value: "78",
      status: 'draft',
      at: new Date().toISOString(),
    }];
    writeCollection('flash', seed);
    return seed;
  }
  return list;
}

function openFlashFlags() {
  const flags = readCollection('flash-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addFlashFlag(candidate, actor = 'system') {
  const existing = readCollection('flash-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('flf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('flash-flags', list.slice(0, 200));
  return flag;
}

function isStaleDeal(row) {
  if (row.staleDeal === true || row.status === 'stale') return true;
  const due = Date.parse(row.expiresAt || row.until || '');
  return (row.status === 'draft' || row.status === 'live') && Number.isFinite(due) && due < Date.now();
}

function isPublishedFlash(row) {
  return row.published === true || row.status === 'published' || Boolean(row.publishedAt);
}

function isMidnightSale(row) {
  return row.midnightSale === true || row.saleType === 'midnight';
}

export function listFlash(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createFlash(input = {}, actor = 'system') {
  const row = {
    id: rid('fls'),
    metric: input.metric !== undefined ? input.metric : "Doluluk",
    value: input.value !== undefined ? Number(input.value) || 0 : 78,
    channel: input.channel !== undefined ? input.channel : undefined,
    saleType: input.saleType !== undefined ? input.saleType : undefined,
    expiresAt: input.expiresAt !== undefined ? input.expiresAt : undefined,
    midnightSale: input.midnightSale === true || undefined,
    status: input.status || 'draft',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('flash', row, 300);
  appendAudit({
    actor,
    action: 'flash.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateFlash(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.value !== undefined) next.value = Number(next.value) || 0;
  list[idx] = next;
  writeCollection('flash', list);
  appendAudit({ actor, action: 'flash.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function flashSummary() {
  const list = listFlash();
  const staleDeals = list.filter(isStaleDeal);
  const publishedFlashes = list.filter(isPublishedFlash);
  const midnightSales = list.filter(isMidnightSale);
  const flags = openFlashFlags();
  return {
    title: 'LIKYA Flash Ops',
    total: list.length,
    draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    staleDeals: staleDeals.length,
    publishedFlashes: publishedFlashes.length,
    midnightSales: midnightSales.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      draft: list.filter((x) => x.status === 'draft').length,
      published: list.filter((x) => x.status === 'published').length,
      stale_deals: staleDeals.length,
      published_flashes: publishedFlashes.length,
      midnight_sales: midnightSales.length,
    },
    summaryLines: [
      `Flash ${list.length} row - stale deals ${staleDeals.length} - published ${publishedFlashes.length}`,
      `Draft ${list.filter((x) => x.status === 'draft').length} - midnight sales ${midnightSales.length} - flag ${flags.length}`,
    ],
    flash: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runFlashSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = flashSummary();
  const created = [];
  const candidates = [];
  if (force || overview.staleDeals > 0) {
    candidates.push({
      key: 'flash_stale_deal',
      level: overview.staleDeals > 0 ? 'warn' : 'info',
      text: `Flash stale deals ${overview.staleDeals}`,
      domain: 'deal',
    });
  }
  if (force || overview.publishedFlashes === 0) {
    candidates.push({
      key: 'flash_publish_needed',
      level: overview.publishedFlashes === 0 ? 'warn' : 'info',
      text: `Flash published rows ${overview.publishedFlashes}`,
      domain: 'publish',
    });
  }
  if (force || overview.midnightSales === 0) {
    candidates.push({
      key: 'flash_midnight_sale_seed',
      level: 'info',
      text: `Flash midnight sales ${overview.midnightSales}`,
      domain: 'sale',
    });
  }
  for (const candidate of candidates) {
    const flag = addFlashFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `flash sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('fls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('flash-sweeps', sweep, 80);
  appendAudit({ actor, action: 'flash.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: flashSummary() };
}

export function ackFlashFlag(input = {}, actor = 'system') {
  const list = readCollection('flash-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('flash-flags', list);
  appendAudit({ actor, action: 'flash.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: flashSummary() };
}

export function markFlashStaleDeal(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.metric && x.metric === input.metric));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isStaleDeal(x));
  if (idx < 0) return { ok: false, error: 'Stale deal yapilacak flash yok' };
  list[idx] = {
    ...list[idx],
    status: 'stale',
    staleDeal: true,
    expiresAt: input.expiresAt || new Date(Date.now() - 60 * 60_000).toISOString(),
    staleReason: input.reason || input.staleReason || 'deal_window_expired',
    staleAt: input.staleAt || new Date().toISOString(),
    staleBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('flash', list);
  appendAudit({ actor, action: 'flash.stale_deal', detail: list[idx].metric || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, flash: list[idx], overview: flashSummary() };
}

export function publishFlash(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.metric && x.metric === input.metric));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'draft' || isStaleDeal(x));
  if (idx < 0) return { ok: false, error: 'Publish edilecek flash yok' };
  list[idx] = {
    ...list[idx],
    status: 'published',
    staleDeal: false,
    published: true,
    channel: input.channel || list[idx].channel || 'ceo-panel',
    publishedAt: input.publishedAt || new Date().toISOString(),
    publishedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('flash', list);
  appendAudit({ actor, action: 'flash.publish', detail: list[idx].metric || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, flash: list[idx], overview: flashSummary() };
}

export function seedMidnightSale(input = {}, actor = 'system') {
  const row = createFlash(
    {
      metric: input.metric || 'Midnight sale',
      value: Number(input.value ?? 25) || 25,
      channel: input.channel || 'app',
      saleType: 'midnight',
      midnightSale: true,
      expiresAt: input.expiresAt || new Date(Date.now() + 6 * 60 * 60_000).toISOString(),
      status: input.status || 'draft',
    },
    actor,
  );
  appendAudit({ actor, action: 'flash.seed_midnight_sale', detail: row.metric, meta: { id: row.id } });
  return { ok: true, flash: row, overview: flashSummary() };
}
