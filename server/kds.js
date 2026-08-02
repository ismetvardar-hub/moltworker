/**
 * Wave 165 - Kitchen display system ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const MINUTE_MS = 60_000;
const ACTIVE_STATUSES = new Set(['new', 'cooking', 'ready', 'rush', 'aging']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('kds-tickets', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'kds_1',
        ticket: 'A-17',
        items: 'Kofte menu',
        station: 'Grill',
        status: 'cooking',
        etaMin: 4,
        at: new Date().toISOString(),
      },
    ];
    writeCollection('kds-tickets', seed);
    return seed;
  }
  return list;
}

function openKdsFlags() {
  const flags = readCollection('kds-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addKdsFlag(candidate, actor = 'system') {
  const existing = readCollection('kds-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('kdf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('kds-flags', list.slice(0, 200));
  return flag;
}

function isAgingTicket(row) {
  if (row.status === 'aging') return true;
  if (!ACTIVE_STATUSES.has(row.status)) return false;
  const started = Date.parse(row.at || row.createdAt || '');
  if (!Number.isFinite(started)) return false;
  const eta = Math.max(1, Number(row.etaMin || 8));
  return Date.now() - started > eta * MINUTE_MS;
}

export function listKds(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createKds(input = {}, actor = 'system') {
  const row = {
    id: `kds_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ticket: input.ticket !== undefined ? input.ticket : 'B-01',
    items: input.items !== undefined ? input.items : 'Ayran',
    station: input.station || 'Expo',
    etaMin: input.etaMin !== undefined ? Number(input.etaMin) || 0 : 3,
    priority: input.priority || 'normal',
    status: input.status || 'cooking',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('kds-tickets', row, 300);
  appendAudit({ actor, action: 'kds.create', detail: String(row.ticket || row.items || row.id), meta: { id: row.id } });
  return row;
}

export function updateKds(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.etaMin !== undefined) next.etaMin = Number(next.etaMin) || 0;
  list[idx] = next;
  writeCollection('kds-tickets', list);
  appendAudit({ actor, action: 'kds.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function kdsSummary() {
  const list = listKds();
  const aging = list.filter(isAgingTicket);
  const rush = list.filter((x) => x.priority === 'rush' || x.status === 'rush');
  const flags = openKdsFlags();
  return {
    title: 'LIKYA KDS Ops',
    total: list.length,
    bump: list.filter((x) => x.status === 'bump' || x.status === 'bumped').length,
    cooking: list.filter((x) => x.status === 'cooking').length,
    ready: list.filter((x) => x.status === 'ready').length,
    aging: aging.length,
    rush: rush.length,
    active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      cooking: list.filter((x) => x.status === 'cooking').length,
      ready: list.filter((x) => x.status === 'ready').length,
      aging: aging.length,
      rush: rush.length,
    },
    summaryLines: [
      `KDS ${list.length} ticket - cooking ${list.filter((x) => x.status === 'cooking').length} - aging ${aging.length}`,
      `Rush ${rush.length} - ready ${list.filter((x) => x.status === 'ready').length} - flag ${flags.length}`,
    ],
    tickets: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runKdsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = kdsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.aging > 0) {
    candidates.push({
      key: 'kds_ticket_aging',
      level: overview.aging > 0 ? 'warn' : 'info',
      text: `Aging KDS ticket ${overview.aging}`,
      domain: 'aging',
    });
  }
  if (force || overview.rush > 0) {
    candidates.push({
      key: 'kds_rush_ticket_queue',
      level: overview.rush > 2 ? 'alert' : 'info',
      text: `Rush KDS ticket ${overview.rush}`,
      domain: 'rush',
    });
  }
  if (force || overview.cooking > 0) {
    candidates.push({
      key: 'kds_cooking_load',
      level: overview.cooking > 8 ? 'warn' : 'info',
      text: `Cooking KDS ticket ${overview.cooking}`,
      domain: 'load',
    });
  }
  for (const candidate of candidates) {
    const flag = addKdsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `kds sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('kds'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('kds-sweeps', sweep, 80);
  appendAudit({ actor, action: 'kds.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: kdsSummary() };
}

export function ackKdsFlag(input = {}, actor = 'system') {
  const list = readCollection('kds-flags', []) || [];
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
  writeCollection('kds-flags', list);
  appendAudit({ actor, action: 'kds.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: kdsSummary() };
}

export function ageKdsTicket(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => ACTIVE_STATUSES.has(x.status));
  if (idx < 0) return { ok: false, error: 'Aging yapilacak KDS ticket yok' };
  list[idx] = {
    ...list[idx],
    status: 'aging',
    priority: input.priority || list[idx].priority || 'rush',
    etaMin: Number(input.etaMin ?? list[idx].etaMin ?? 1) || 1,
    agingReason: input.reason || input.agingReason || 'Ticket exceeded expo ETA',
    agedAt: input.agedAt || new Date().toISOString(),
    agedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('kds-tickets', list);
  appendAudit({ actor, action: 'kds.ticket_age', detail: list[idx].ticket || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, ticket: list[idx], overview: kdsSummary() };
}

export function bumpKdsTicket(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'bump' && x.status !== 'bumped');
  if (idx < 0) return { ok: false, error: 'Bump edilecek KDS ticket yok' };
  list[idx] = {
    ...list[idx],
    status: 'bump',
    bumpedAt: input.bumpedAt || new Date().toISOString(),
    bumpedBy: actor,
    bumpNote: input.note || input.bumpNote || 'Bumped from KDS',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('kds-tickets', list);
  appendAudit({ actor, action: 'kds.ticket_bump', detail: list[idx].ticket || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, ticket: list[idx], overview: kdsSummary() };
}

export function seedRushKdsTicket(input = {}, actor = 'system') {
  const ticket = createKds(
    {
      ticket: input.ticket || `R-${Math.floor(100 + Math.random() * 900)}`,
      items: input.items || 'Rush fire table',
      station: input.station || 'Expo',
      etaMin: Number(input.etaMin ?? 2),
      priority: 'rush',
      status: input.status || 'rush',
      at: input.at || new Date(Date.now() - 3 * MINUTE_MS).toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'kds.seed_rush_ticket', detail: ticket.ticket, meta: { id: ticket.id } });
  return { ok: true, ticket, overview: kdsSummary() };
}
