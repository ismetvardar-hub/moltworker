import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 168 - Dive desk ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('dive', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'div_1',
      activity: "Snorkel",
      guestName: "Misafir",
      status: 'booked',
      certExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('dive', seed);
    return seed;
  }
  return list;
}

function openDiveFlags() {
  const flags = readCollection('dive-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addDiveFlag(candidate, actor = 'system') {
  const existing = readCollection('dive-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('dvf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('dive-flags', list.slice(0, 200));
  return flag;
}

function isCertExpired(row) {
  if (row.status === 'cert_expired' || row.certExpired === true) return true;
  const expires = Date.parse(row.certExpiresAt || row.certExpiry || '');
  return Number.isFinite(expires) && expires < Date.now();
}

export function listDive(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createDive(input = {}, actor = 'system') {
  const row = {
    id: rid('div'),
    activity: input.activity !== undefined ? input.activity : "Snorkel",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    boat: input.boat || null,
    departureAt: input.departureAt || input.depart || null,
    certNo: input.certNo || null,
    certExpiresAt: input.certExpiresAt || input.certExpiry || null,
    seats: Number(input.seats ?? input.pax ?? 1) || 1,
    status: input.status || 'booked',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dive', row, 300);
  appendAudit({
    actor,
    action: 'dive.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateDive(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.seats !== undefined) next.seats = Number(next.seats) || 0;
  list[idx] = next;
  writeCollection('dive', list);
  appendAudit({ actor, action: 'dive.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function diveSummary() {
  const list = listDive();
  const expiredCerts = list.filter(isCertExpired);
  const checkedIn = list.filter((x) => x.status === 'checked_in' || x.checkedInAt);
  const boatTrips = list.filter((x) => x.boatTrip === true || x.status === 'boat_trip');
  const flags = openDiveFlags();
  return {
    title: 'LIKYA Dive Ops',
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    departed: list.filter((x) => x.status === 'departed').length,
    done: list.filter((x) => x.status === 'done').length,
    checked_in: checkedIn.length,
    expiredCerts: expiredCerts.length,
    boatTrips: boatTrips.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      booked: list.filter((x) => x.status === 'booked').length,
      departed: list.filter((x) => x.status === 'departed').length,
      done: list.filter((x) => x.status === 'done').length,
      checked_in: checkedIn.length,
      expired_certs: expiredCerts.length,
      boat_trips: boatTrips.length,
    },
    summaryLines: [
      `Dive ${list.length} booking - checked in ${checkedIn.length} - departed ${list.filter((x) => x.status === 'departed').length}`,
      `Expired certs ${expiredCerts.length} - boat trips ${boatTrips.length} - flag ${flags.length}`,
    ],
    dive: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runDiveSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = diveSummary();
  const created = [];
  const candidates = [];
  if (force || overview.expiredCerts > 0) {
    candidates.push({
      key: 'dive_cert_expired',
      level: overview.expiredCerts > 0 ? 'alert' : 'info',
      text: `Dive certifications expired ${overview.expiredCerts}`,
      domain: 'cert',
    });
  }
  if (force || overview.booked > overview.checked_in) {
    candidates.push({
      key: 'dive_checkin_queue',
      level: overview.booked > overview.checked_in ? 'warn' : 'info',
      text: `Dive check-in queue ${overview.booked}`,
      domain: 'checkin',
    });
  }
  if (force || overview.boatTrips > 0) {
    candidates.push({
      key: 'dive_boat_trip',
      level: 'info',
      text: `Dive boat trips ${overview.boatTrips}`,
      domain: 'boat',
    });
  }
  for (const candidate of candidates) {
    const flag = addDiveFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `dive sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('dvs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('dive-sweeps', sweep, 80);
  appendAudit({ actor, action: 'dive.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: diveSummary() };
}

export function ackDiveFlag(input = {}, actor = 'system') {
  const list = readCollection('dive-flags', []) || [];
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
  writeCollection('dive-flags', list);
  appendAudit({ actor, action: 'dive.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: diveSummary() };
}

export function markDiveCertExpired(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'booked' || x.status === 'checked_in');
  if (idx < 0) return { ok: false, error: 'Cert expired yapilacak dive booking yok' };
  list[idx] = {
    ...list[idx],
    status: 'cert_expired',
    certExpired: true,
    certExpiresAt: input.certExpiresAt || new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    certFlaggedAt: input.certFlaggedAt || new Date().toISOString(),
    certFlaggedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('dive', list);
  appendAudit({ actor, action: 'dive.cert_expired', detail: list[idx].guestName || list[idx].activity, meta: { id: list[idx].id } });
  return { ok: true, dive: list[idx], overview: diveSummary() };
}

export function checkInDive(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'booked' || x.status === 'boat_trip');
  if (idx < 0) return { ok: false, error: 'Check-in yapilacak dive booking yok' };
  list[idx] = {
    ...list[idx],
    status: 'checked_in',
    checkedInAt: input.checkedInAt || new Date().toISOString(),
    checkedInBy: actor,
    boat: input.boat || list[idx].boat || null,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('dive', list);
  appendAudit({ actor, action: 'dive.check_in', detail: list[idx].guestName || list[idx].activity, meta: { id: list[idx].id } });
  return { ok: true, dive: list[idx], overview: diveSummary() };
}

export function seedBoatTrip(input = {}, actor = 'system') {
  const dive = createDive(
    {
      activity: input.activity || 'Boat dive',
      guestName: input.guestName || 'Boat trip guest',
      boat: input.boat || 'Likya-1',
      departureAt: input.departureAt || new Date(Date.now() + 90 * 60_000).toISOString(),
      seats: Number(input.seats ?? input.pax ?? 6) || 6,
      certExpiresAt: input.certExpiresAt || new Date(Date.now() + 90 * 24 * 60 * 60_000).toISOString(),
      status: input.status || 'booked',
    },
    actor,
  );
  updateDive(dive.id, { boatTrip: true, manifestStatus: input.manifestStatus || 'open' }, actor);
  appendAudit({ actor, action: 'dive.seed_boat_trip', detail: dive.activity, meta: { id: dive.id } });
  return { ok: true, dive: { ...dive, boatTrip: true, manifestStatus: input.manifestStatus || 'open' }, overview: diveSummary() };
}
