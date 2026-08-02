/**
 * Wave 172 - Towel stock ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('towels', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'twl_1',
      zone: 'Beach',
      qty: 50,
      status: 'ok',
      at: new Date().toISOString(),
    }];
    writeCollection('towels', seed);
    return seed;
  }
  return list;
}

function openTowelsFlags() {
  const flags = readCollection('towels-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addTowelsFlag(candidate, actor = 'system') {
  const existing = readCollection('towels-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('twf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('towels-flags', list.slice(0, 200));
  return flag;
}

function isShortageZone(row) {
  return row.shortageZone === true || row.status === 'critical' || Number(row.qty ?? 0) < Number(row.minQty ?? 20);
}

export function listTowels(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createTowels(input = {}, actor = 'system') {
  const row = {
    id: rid('twl'),
    zone: input.zone !== undefined ? input.zone : 'Beach',
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 50,
    minQty: input.minQty !== undefined ? Number(input.minQty) || 0 : 20,
    status: input.status || 'ok',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('towels', row, 300);
  appendAudit({
    actor,
    action: 'towels.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateTowels(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  if (next.minQty !== undefined) next.minQty = Number(next.minQty) || 0;
  list[idx] = next;
  writeCollection('towels', list);
  appendAudit({ actor, action: 'towels.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function towelsSummary() {
  const list = listTowels();
  const shortageZones = list.filter(isShortageZone);
  const poolRushes = list.filter((x) => x.poolRush === true || x.rushType === 'pool');
  const flags = openTowelsFlags();
  return {
    title: 'LIKYA Towels Ops',
    total: list.length,
    ok: list.filter((x) => x.status === 'ok').length,
    low: list.filter((x) => x.status === 'low').length,
    critical: list.filter((x) => x.status === 'critical').length,
    shortageZones: shortageZones.length,
    poolRushes: poolRushes.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      ok: list.filter((x) => x.status === 'ok').length,
      low: list.filter((x) => x.status === 'low').length,
      critical: list.filter((x) => x.status === 'critical').length,
      shortage_zones: shortageZones.length,
      pool_rushes: poolRushes.length,
    },
    summaryLines: [
      `Towels ${list.length} zone - shortage ${shortageZones.length} - critical ${list.filter((x) => x.status === 'critical').length}`,
      `Pool rush ${poolRushes.length} - ok ${list.filter((x) => x.status === 'ok').length} - flag ${flags.length}`,
    ],
    towels: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runTowelsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = towelsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.shortageZones > 0) {
    candidates.push({
      key: 'towels_shortage_zone',
      level: overview.shortageZones > 0 ? 'warn' : 'info',
      text: `Towel shortage zones ${overview.shortageZones}`,
      domain: 'shortage',
    });
  }
  if (force || overview.ok > 0) {
    candidates.push({
      key: 'towels_restock_flow',
      level: 'info',
      text: `Towel zones ok ${overview.ok}`,
      domain: 'restock',
    });
  }
  if (force || overview.poolRushes > 0) {
    candidates.push({
      key: 'towels_pool_rush',
      level: 'info',
      text: `Pool rush towel zones ${overview.poolRushes}`,
      domain: 'pool',
    });
  }
  for (const candidate of candidates) {
    const flag = addTowelsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `towels sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('tws'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('towels-sweeps', sweep, 80);
  appendAudit({ actor, action: 'towels.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: towelsSummary() };
}

export function ackTowelsFlag(input = {}, actor = 'system') {
  const list = readCollection('towels-flags', []) || [];
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
  writeCollection('towels-flags', list);
  appendAudit({ actor, action: 'towels.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: towelsSummary() };
}

export function markTowelsShortageZone(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.zone && x.zone === input.zone));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'critical');
  if (idx < 0) return { ok: false, error: 'Shortage yapilacak towel zone yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'critical',
    qty: Number(input.qty ?? 6) || 6,
    minQty: Number(input.minQty ?? list[idx].minQty ?? 20) || 20,
    shortageZone: true,
    shortageAt: input.shortageAt || new Date().toISOString(),
    shortageBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('towels', list);
  appendAudit({ actor, action: 'towels.shortage_zone', detail: list[idx].zone || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, towel: list[idx], overview: towelsSummary() };
}

export function restockTowels(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.zone && x.zone === input.zone));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isShortageZone);
  if (idx < 0) return { ok: false, error: 'Restock edilecek towel zone yok' };
  list[idx] = {
    ...list[idx],
    status: 'ok',
    qty: Number(input.qty ?? input.restockQty ?? 80) || 80,
    shortageZone: false,
    restockedAt: input.restockedAt || new Date().toISOString(),
    restockedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('towels', list);
  appendAudit({ actor, action: 'towels.restock', detail: list[idx].zone || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, towel: list[idx], overview: towelsSummary() };
}

export function seedPoolRush(input = {}, actor = 'system') {
  const towel = createTowels(
    {
      zone: input.zone || 'Pool Deck',
      qty: Number(input.qty ?? 12) || 12,
      minQty: Number(input.minQty ?? 40) || 40,
      status: input.status || 'low',
    },
    actor,
  );
  const patched = updateTowels(
    towel.id,
    {
      poolRush: true,
      rushType: 'pool',
      shortageZone: true,
      source: 'wave172',
    },
    actor,
  );
  appendAudit({ actor, action: 'towels.seed_pool_rush', detail: patched?.zone || towel.zone, meta: { id: towel.id } });
  return { ok: true, towel: patched || towel, overview: towelsSummary() };
}
