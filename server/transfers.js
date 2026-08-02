/**
 * AŞAMA 79 — Transfer Masası.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const HOUR_MS = 60 * 60_000;
const ACTIVE_STATUSES = new Set(['requested', 'assigned', 'delayed']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('transfers', null);
  if (!Array.isArray(list) || list.length === 0) {
    const now = new Date();
    const seed = [{
      id: 'tra_1',
      guestName: "Misafir",
      destination: "Havalimanı",
      pickupAt: new Date(now.getTime() + 45 * 60_000).toISOString(),
      pax: 2,
      driver: null,
      status: 'requested',
      at: now.toISOString(),
    }];
    writeCollection('transfers', seed);
    return seed;
  }
  return list;
}

function isDelayedPickup(row) {
  if (row.status === 'delayed') return true;
  if (!ACTIVE_STATUSES.has(row.status)) return false;
  const pickupAt = Date.parse(row.pickupAt || row.pickup_at || row.at || '');
  return Number.isFinite(pickupAt) && pickupAt + 15 * 60_000 < Date.now();
}

function openTransfersFlags() {
  const flags = readCollection('transfers-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addTransfersFlag(candidate, actor = 'system') {
  const existing = readCollection('transfers-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('trf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('transfers-flags', list.slice(0, 200));
  return flag;
}

export function listTransfers(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createTransfers(input = {}, actor = 'system') {
  const row = {
    id: `tra_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    destination: input.destination !== undefined ? input.destination : "Havalimanı",
    pickupAt: input.pickupAt || input.pickup_at || null,
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 1,
    driver: input.driver || null,
    vehicle: input.vehicle || null,
    delayMinutes: input.delayMinutes !== undefined ? Number(input.delayMinutes) || 0 : 0,
    status: input.status || 'requested',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('transfers', row, 300);
  appendAudit({
    actor,
    action: 'transfers.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateTransfers(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  for (const key of ['pax', 'delayMinutes']) {
    if (next[key] !== undefined) next[key] = Number(next[key]) || 0;
  }
  list[idx] = next;
  writeCollection('transfers', list);
  appendAudit({ actor, action: 'transfers.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function transfersSummary() {
  const list = listTransfers();
  const delayed = list.filter(isDelayedPickup);
  const airport = list.filter((x) => /airport|havaliman/i.test(String(x.destination || x.route || '')));
  const flags = openTransfersFlags();
  return {
    title: 'LİKYA Transfer Ops',
    total: list.length,
    requested: list.filter((x) => x.status === 'requested').length,
    assigned: list.filter((x) => x.status === 'assigned').length,
    done: list.filter((x) => x.status === 'done').length,
    delayed: delayed.length,
    airportRuns: airport.length,
    active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      requested: list.filter((x) => x.status === 'requested').length,
      assigned: list.filter((x) => x.status === 'assigned').length,
      done: list.filter((x) => x.status === 'done').length,
      delayed: delayed.length,
      airport_runs: airport.length,
      active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    },
    summaryLines: [
      `Transfer ${list.length} ride · active ${list.filter((x) => ACTIVE_STATUSES.has(x.status)).length} · delayed ${delayed.length}`,
      `Airport ${airport.length} · assigned ${list.filter((x) => x.status === 'assigned').length} · flag ${flags.length}`,
    ],
    rides: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runTransfersSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = transfersSummary();
  const created = [];
  const candidates = [];
  if (force || overview.delayed > 0) {
    candidates.push({
      key: 'transfers_delayed_pickups',
      level: overview.delayed > 0 ? 'alert' : 'info',
      text: `Geciken pickup ${overview.delayed}`,
      domain: 'pickup',
    });
  }
  if (force || overview.requested > 0) {
    candidates.push({
      key: 'transfers_requested_queue',
      level: overview.requested > 3 ? 'warn' : 'info',
      text: `Atama bekleyen transfer ${overview.requested}`,
      domain: 'dispatch',
    });
  }
  if (force || overview.airportRuns > 0) {
    candidates.push({
      key: 'transfers_airport_runs',
      level: 'info',
      text: `Airport run ${overview.airportRuns}`,
      domain: 'airport',
    });
  }
  for (const candidate of candidates) {
    const flag = addTransfersFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HERMES',
        title: `transfers sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('trs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('transfers-sweeps', sweep, 80);
  appendAudit({ actor, action: 'transfers.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: transfersSummary() };
}

export function ackTransfersFlag(input = {}, actor = 'system') {
  const list = readCollection('transfers-flags', []) || [];
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
  writeCollection('transfers-flags', list);
  appendAudit({ actor, action: 'transfers.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: transfersSummary() };
}

export function delayTransferPickup(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => ACTIVE_STATUSES.has(x.status));
  if (idx < 0) return { ok: false, error: 'Geciktirilecek pickup yok' };
  const delayMinutes = Number(input.delayMinutes ?? input.minutes ?? 20) || 20;
  list[idx] = {
    ...list[idx],
    status: 'delayed',
    delayMinutes,
    delayReason: input.reason || input.delayReason || 'Ops pickup delay',
    delayedAt: input.delayedAt || new Date().toISOString(),
    delayedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('transfers', list);
  appendAudit({ actor, action: 'transfers.delay_pickup', detail: list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, ride: list[idx], overview: transfersSummary() };
}

export function completeTransferRide(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Tamamlanacak transfer yok' };
  list[idx] = {
    ...list[idx],
    status: 'done',
    completedAt: input.completedAt || new Date().toISOString(),
    completedBy: actor,
    driver: input.driver || list[idx].driver || 'Ops driver',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('transfers', list);
  appendAudit({ actor, action: 'transfers.complete', detail: list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, ride: list[idx], overview: transfersSummary() };
}

export function seedAirportTransferRun(input = {}, actor = 'system') {
  const ride = createTransfers(
    {
      guestName: input.guestName || 'VIP Airport Run',
      destination: input.destination || 'Havalimanı',
      pickupAt: input.pickupAt || new Date(Date.now() + HOUR_MS).toISOString(),
      pax: Number(input.pax ?? 2),
      driver: input.driver || 'Ops driver',
      vehicle: input.vehicle || 'Mercedes Vito',
      status: input.status || 'assigned',
    },
    actor,
  );
  appendAudit({ actor, action: 'transfers.seed_airport_run', detail: ride.guestName, meta: { id: ride.id } });
  return { ok: true, ride, overview: transfersSummary() };
}
