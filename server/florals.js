import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 178 - Floral arrangement ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('florals', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'flr_1',
      arrangement: "Buket",
      room: "101",
      status: 'ordered',
      at: new Date().toISOString(),
    }];
    writeCollection('florals', seed);
    return seed;
  }
  return list;
}

function openFloralsFlags() {
  const flags = readCollection('florals-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addFloralsFlag(candidate, actor = 'system') {
  const existing = readCollection('florals-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('flrf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('florals-flags', list.slice(0, 200));
  return flag;
}

function isWiltedArrangement(row) {
  return row.wiltedArrangement === true || row.status === 'wilted' || Boolean(row.wiltedAt);
}

function isVaseRefreshed(row) {
  return row.vaseRefreshed === true || row.status === 'refreshed' || Boolean(row.refreshedAt);
}

function isWeddingPackage(row) {
  return row.weddingPackage === true || row.packageType === 'wedding';
}

export function listFlorals(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createFlorals(input = {}, actor = 'system') {
  const row = {
    id: rid('flr'),
    arrangement: input.arrangement !== undefined ? input.arrangement : "Buket",
    room: input.room !== undefined ? input.room : "101",
    eventName: input.eventName !== undefined ? input.eventName : undefined,
    packageType: input.packageType !== undefined ? input.packageType : undefined,
    vaseRefreshed: input.vaseRefreshed === true || undefined,
    weddingPackage: input.weddingPackage === true || undefined,
    status: input.status || 'ordered',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('florals', row, 300);
  appendAudit({
    actor,
    action: 'florals.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateFlorals(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('florals', list);
  appendAudit({ actor, action: 'florals.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function floralsSummary() {
  const list = listFlorals();
  const wiltedArrangements = list.filter(isWiltedArrangement);
  const refreshedVases = list.filter(isVaseRefreshed);
  const weddingPackages = list.filter(isWeddingPackage);
  const flags = openFloralsFlags();
  return {
    title: 'LIKYA Florals Ops',
    total: list.length,
    ordered: list.filter((x) => x.status === 'ordered').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length,
    wiltedArrangements: wiltedArrangements.length,
    refreshedVases: refreshedVases.length,
    weddingPackages: weddingPackages.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      ordered: list.filter((x) => x.status === 'ordered').length,
      delivered: list.filter((x) => x.status === 'delivered').length,
      cancelled: list.filter((x) => x.status === 'cancelled').length,
      wilted_arrangements: wiltedArrangements.length,
      refreshed_vases: refreshedVases.length,
      wedding_packages: weddingPackages.length,
    },
    summaryLines: [
      `Florals ${list.length} arrangement - wilted ${wiltedArrangements.length} - refreshed ${refreshedVases.length}`,
      `Ordered ${list.filter((x) => x.status === 'ordered').length} - wedding packages ${weddingPackages.length} - flag ${flags.length}`,
    ],
    florals: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runFloralsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = floralsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.wiltedArrangements > 0) {
    candidates.push({
      key: 'florals_wilted_arrangement',
      level: overview.wiltedArrangements > 0 ? 'warn' : 'info',
      text: `Florals wilted arrangements ${overview.wiltedArrangements}`,
      domain: 'arrangement',
    });
  }
  if (force || overview.refreshedVases === 0) {
    candidates.push({
      key: 'florals_vase_refresh_needed',
      level: overview.refreshedVases === 0 ? 'warn' : 'info',
      text: `Florals refreshed vases ${overview.refreshedVases}`,
      domain: 'vase',
    });
  }
  if (force || overview.weddingPackages === 0) {
    candidates.push({
      key: 'florals_wedding_package_seed',
      level: 'info',
      text: `Florals wedding packages ${overview.weddingPackages}`,
      domain: 'wedding',
    });
  }
  for (const candidate of candidates) {
    const flag = addFloralsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `florals sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('flrs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('florals-sweeps', sweep, 80);
  appendAudit({ actor, action: 'florals.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: floralsSummary() };
}

export function ackFloralsFlag(input = {}, actor = 'system') {
  const list = readCollection('florals-flags', []) || [];
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
  writeCollection('florals-flags', list);
  appendAudit({ actor, action: 'florals.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: floralsSummary() };
}

export function markFloralsWiltedArrangement(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.arrangement && x.arrangement === input.arrangement));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isWiltedArrangement(x));
  if (idx < 0) return { ok: false, error: 'Wilted yapilacak floral arrangement yok' };
  list[idx] = {
    ...list[idx],
    status: 'wilted',
    wiltedArrangement: true,
    wiltedReason: input.reason || input.wiltedReason || 'heat_exposure',
    wiltedAt: input.wiltedAt || new Date().toISOString(),
    wiltedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('florals', list);
  appendAudit({ actor, action: 'florals.wilted_arrangement', detail: list[idx].arrangement || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, arrangement: list[idx], overview: floralsSummary() };
}

export function refreshFloralsVase(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isWiltedArrangement(x) || x.status === 'ordered');
  if (idx < 0) return { ok: false, error: 'Refresh edilecek floral vase yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'refreshed',
    wiltedArrangement: false,
    vaseRefreshed: true,
    refreshNote: input.note || input.refreshNote || 'Fresh water and stems reset',
    refreshedAt: input.refreshedAt || new Date().toISOString(),
    refreshedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('florals', list);
  appendAudit({ actor, action: 'florals.vase_refresh', detail: list[idx].arrangement || list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, arrangement: list[idx], overview: floralsSummary() };
}

export function seedWeddingPackage(input = {}, actor = 'system') {
  const arrangement = createFlorals(
    {
      arrangement: input.arrangement || 'Wave 178 Wedding Package',
      room: input.room || 'Garden suite',
      eventName: input.eventName || 'Sunset wedding',
      packageType: 'wedding',
      weddingPackage: true,
      status: input.status || 'ordered',
    },
    actor,
  );
  appendAudit({ actor, action: 'florals.seed_wedding_package', detail: arrangement.arrangement, meta: { id: arrangement.id } });
  return { ok: true, arrangement, overview: floralsSummary() };
}
