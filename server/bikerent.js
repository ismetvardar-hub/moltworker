import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 177 - Bike rental return ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('bikerent', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bik_1',
      bikeNo: "BK-01",
      guestName: "Misafir",
      status: 'available',
      at: new Date().toISOString(),
    }];
    writeCollection('bikerent', seed);
    return seed;
  }
  return list;
}

function openBikerentFlags() {
  const flags = readCollection('bikerent-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBikerentFlag(candidate, actor = 'system') {
  const existing = readCollection('bikerent-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('bkf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('bikerent-flags', list.slice(0, 200));
  return flag;
}

function isOverdueReturn(row) {
  if (row.overdueReturn === true || row.status === 'overdue') return true;
  if (row.status !== 'rented') return false;
  const due = Date.parse(row.dueAt || row.until || '');
  return Number.isFinite(due) && due < Date.now();
}

function isCheckedInBike(row) {
  return row.checkedInBike === true || row.status === 'checked_in' || Boolean(row.checkedInAt || row.returnedAt);
}

function isCoastalRide(row) {
  return row.coastalRide === true || row.routeType === 'coastal' || String(row.route || '').toLowerCase().includes('coast');
}

export function listBikerent(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBikerent(input = {}, actor = 'system') {
  const row = {
    id: rid('bik'),
    bikeNo: input.bikeNo !== undefined ? input.bikeNo : "BK-01",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    route: input.route !== undefined ? input.route : undefined,
    routeType: input.routeType !== undefined ? input.routeType : undefined,
    dueAt: input.dueAt !== undefined ? input.dueAt : undefined,
    coastalRide: input.coastalRide === true || undefined,
    status: input.status || 'available',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bikerent', row, 300);
  appendAudit({
    actor,
    action: 'bikerent.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBikerent(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bikerent', list);
  appendAudit({ actor, action: 'bikerent.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function bikerentSummary() {
  const list = listBikerent();
  const overdueReturns = list.filter(isOverdueReturn);
  const checkedInBikes = list.filter(isCheckedInBike);
  const coastalRides = list.filter(isCoastalRide);
  const flags = openBikerentFlags();
  return {
    title: 'LIKYA Bike Rental Ops',
    total: list.length,
    available: list.filter((x) => x.status === 'available').length,
    rented: list.filter((x) => x.status === 'rented').length,
    service: list.filter((x) => x.status === 'service').length,
    overdueReturns: overdueReturns.length,
    checkedInBikes: checkedInBikes.length,
    coastalRides: coastalRides.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      available: list.filter((x) => x.status === 'available').length,
      rented: list.filter((x) => x.status === 'rented').length,
      service: list.filter((x) => x.status === 'service').length,
      overdue_returns: overdueReturns.length,
      checked_in_bikes: checkedInBikes.length,
      coastal_rides: coastalRides.length,
    },
    summaryLines: [
      `Bike rent ${list.length} bike - overdue returns ${overdueReturns.length} - checked-in ${checkedInBikes.length}`,
      `Available ${list.filter((x) => x.status === 'available').length} - coastal rides ${coastalRides.length} - flag ${flags.length}`,
    ],
    bikerent: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBikerentSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = bikerentSummary();
  const created = [];
  const candidates = [];
  if (force || overview.overdueReturns > 0) {
    candidates.push({
      key: 'bikerent_overdue_return',
      level: overview.overdueReturns > 0 ? 'warn' : 'info',
      text: `Bike rent overdue returns ${overview.overdueReturns}`,
      domain: 'return',
    });
  }
  if (force || overview.checkedInBikes === 0) {
    candidates.push({
      key: 'bikerent_checkin_needed',
      level: overview.checkedInBikes === 0 ? 'warn' : 'info',
      text: `Bike rent checked-in bikes ${overview.checkedInBikes}`,
      domain: 'checkin',
    });
  }
  if (force || overview.coastalRides === 0) {
    candidates.push({
      key: 'bikerent_coastal_ride_seed',
      level: 'info',
      text: `Bike rent coastal rides ${overview.coastalRides}`,
      domain: 'route',
    });
  }
  for (const candidate of candidates) {
    const flag = addBikerentFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `bikerent sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('bks'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('bikerent-sweeps', sweep, 80);
  appendAudit({ actor, action: 'bikerent.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: bikerentSummary() };
}

export function ackBikerentFlag(input = {}, actor = 'system') {
  const list = readCollection('bikerent-flags', []) || [];
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
  writeCollection('bikerent-flags', list);
  appendAudit({ actor, action: 'bikerent.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: bikerentSummary() };
}

export function markBikerentOverdueReturn(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.bikeNo && x.bikeNo === input.bikeNo));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isOverdueReturn(x));
  if (idx < 0) return { ok: false, error: 'Overdue return yapilacak bike yok' };
  list[idx] = {
    ...list[idx],
    status: 'overdue',
    overdueReturn: true,
    dueAt: input.dueAt || new Date(Date.now() - 90 * 60_000).toISOString(),
    overdueReason: input.reason || input.overdueReason || 'return_window_missed',
    overdueAt: input.overdueAt || new Date().toISOString(),
    overdueBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('bikerent', list);
  appendAudit({ actor, action: 'bikerent.overdue_return', detail: list[idx].bikeNo || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, bike: list[idx], overview: bikerentSummary() };
}

export function checkInBikerentBike(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.bikeNo && x.bikeNo === input.bikeNo));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isOverdueReturn(x) || x.status === 'rented');
  if (idx < 0) return { ok: false, error: 'Check-in yapilacak bike yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'available',
    checkedInBike: true,
    overdueReturn: false,
    returnedAt: input.returnedAt || new Date().toISOString(),
    checkedInAt: input.checkedInAt || new Date().toISOString(),
    checkedInBy: actor,
    dock: input.dock || list[idx].dock || 'Bike House',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('bikerent', list);
  appendAudit({ actor, action: 'bikerent.checkin', detail: list[idx].bikeNo || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, bike: list[idx], overview: bikerentSummary() };
}

export function seedCoastalRide(input = {}, actor = 'system') {
  const bike = createBikerent(
    {
      bikeNo: input.bikeNo || 'BK-COAST-177',
      guestName: input.guestName || 'Coastal Ride Guest',
      route: input.route || 'Likya coastal ride',
      routeType: 'coastal',
      coastalRide: true,
      dueAt: input.dueAt || new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
      status: input.status || 'rented',
    },
    actor,
  );
  appendAudit({ actor, action: 'bikerent.seed_coastal_ride', detail: bike.bikeNo, meta: { id: bike.id } });
  return { ok: true, bike, overview: bikerentSummary() };
}
