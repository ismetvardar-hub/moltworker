/**
 * Wave 176 - Bedding and linen ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('bedding', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bed_1',
      room: "204",
      item: "Extra bed",
      status: 'requested',
      at: new Date().toISOString(),
    }];
    writeCollection('bedding', seed);
    return seed;
  }
  return list;
}

function openBeddingFlags() {
  const flags = readCollection('bedding-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBeddingFlag(candidate, actor = 'system') {
  const existing = readCollection('bedding-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('bef'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('bedding-flags', list.slice(0, 200));
  return flag;
}

function isLinenShortage(row) {
  return row.linenShortage === true || row.status === 'shortage' || row.status === 'linen_shortage';
}

function isRestocked(row) {
  return row.restocked === true || row.status === 'restocked' || Boolean(row.restockedAt);
}

function isTurndownKit(row) {
  return row.turndownKit === true || row.kitType === 'turndown';
}

export function listBedding(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBedding(input = {}, actor = 'system') {
  const row = {
    id: rid('bed'),
    room: input.room !== undefined ? input.room : "204",
    item: input.item !== undefined ? input.item : "Extra bed",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : undefined,
    kitType: input.kitType !== undefined ? input.kitType : undefined,
    turndownKit: input.turndownKit === true || undefined,
    status: input.status || 'requested',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bedding', row, 300);
  appendAudit({
    actor,
    action: 'bedding.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBedding(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  list[idx] = next;
  writeCollection('bedding', list);
  appendAudit({ actor, action: 'bedding.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function beddingSummary() {
  const list = listBedding();
  const linenShortages = list.filter(isLinenShortage);
  const restocked = list.filter(isRestocked);
  const turndownKits = list.filter(isTurndownKit);
  const flags = openBeddingFlags();
  return {
    title: 'LIKYA Bedding Ops',
    total: list.length,
    requested: list.filter((x) => x.status === 'requested').length,
    set: list.filter((x) => x.status === 'set').length,
    removed: list.filter((x) => x.status === 'removed').length,
    linenShortages: linenShortages.length,
    restocked: restocked.length,
    turndownKits: turndownKits.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      requested: list.filter((x) => x.status === 'requested').length,
      set: list.filter((x) => x.status === 'set').length,
      removed: list.filter((x) => x.status === 'removed').length,
      linen_shortages: linenShortages.length,
      restocked: restocked.length,
      turndown_kits: turndownKits.length,
    },
    summaryLines: [
      `Bedding ${list.length} request - linen shortage ${linenShortages.length} - restocked ${restocked.length}`,
      `Requested ${list.filter((x) => x.status === 'requested').length} - turndown kit ${turndownKits.length} - flag ${flags.length}`,
    ],
    bedding: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBeddingSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = beddingSummary();
  const created = [];
  const candidates = [];
  if (force || overview.linenShortages > 0) {
    candidates.push({
      key: 'bedding_linen_shortage',
      level: overview.linenShortages > 0 ? 'warn' : 'info',
      text: `Bedding linen shortages ${overview.linenShortages}`,
      domain: 'linen',
    });
  }
  if (force || overview.restocked === 0) {
    candidates.push({
      key: 'bedding_restock_needed',
      level: overview.restocked === 0 ? 'warn' : 'info',
      text: `Bedding restocked rows ${overview.restocked}`,
      domain: 'restock',
    });
  }
  if (force || overview.turndownKits === 0) {
    candidates.push({
      key: 'bedding_turndown_kit_seed',
      level: 'info',
      text: `Bedding turndown kits ${overview.turndownKits}`,
      domain: 'turndown',
    });
  }
  for (const candidate of candidates) {
    const flag = addBeddingFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `bedding sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('bes'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('bedding-sweeps', sweep, 80);
  appendAudit({ actor, action: 'bedding.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: beddingSummary() };
}

export function ackBeddingFlag(input = {}, actor = 'system') {
  const list = readCollection('bedding-flags', []) || [];
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
  writeCollection('bedding-flags', list);
  appendAudit({ actor, action: 'bedding.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: beddingSummary() };
}

export function markBeddingLinenShortage(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isLinenShortage(x));
  if (idx < 0) return { ok: false, error: 'Linen shortage yapilacak bedding yok' };
  list[idx] = {
    ...list[idx],
    status: 'linen_shortage',
    linenShortage: true,
    shortageItem: input.item || input.shortageItem || list[idx].item || 'linen set',
    shortageQty: Number(input.qty ?? input.shortageQty ?? 6) || 6,
    shortageReason: input.reason || input.shortageReason || 'laundry_delay',
    shortageAt: input.shortageAt || new Date().toISOString(),
    shortageBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('bedding', list);
  appendAudit({ actor, action: 'bedding.linen_shortage', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, request: list[idx], overview: beddingSummary() };
}

export function restockBeddingLinen(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isLinenShortage(x) || x.status === 'requested');
  if (idx < 0) {
    const request = createBedding({
      room: input.room || 'HK Store',
      item: input.item || 'Linen restock',
      qty: input.qty ?? 24,
      status: 'restocked',
    }, actor);
    return { ok: true, request, overview: beddingSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'restocked',
    restocked: true,
    linenShortage: false,
    restockQty: Number(input.qty ?? input.restockQty ?? 24) || 24,
    restockSource: input.source || input.restockSource || 'laundry_return',
    restockedAt: input.restockedAt || new Date().toISOString(),
    restockedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('bedding', list);
  appendAudit({ actor, action: 'bedding.restock', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, request: list[idx], overview: beddingSummary() };
}

export function seedTurndownKit(input = {}, actor = 'system') {
  const request = createBedding(
    {
      room: input.room || '701',
      item: input.item || 'Turndown kit',
      qty: input.qty ?? 1,
      kitType: 'turndown',
      turndownKit: true,
      status: input.status || 'requested',
    },
    actor,
  );
  appendAudit({ actor, action: 'bedding.seed_turndown_kit', detail: request.room, meta: { id: request.id } });
  return { ok: true, request, overview: beddingSummary() };
}
