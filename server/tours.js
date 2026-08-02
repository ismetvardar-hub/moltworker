import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 169 - Tour desk departure ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('tours', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'tour_1',
      tourName: "Kekova",
      guestName: "Misafir",
      status: 'booked',
      departureAt: new Date(Date.now() + 90 * 60_000).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('tours', seed);
    return seed;
  }
  return list;
}

function openToursFlags() {
  const flags = readCollection('tours-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addToursFlag(candidate, actor = 'system') {
  const existing = readCollection('tours-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('trf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('tours-flags', list.slice(0, 200));
  return flag;
}

function isDepartureSoon(row) {
  if (row.status === 'departure_soon' || row.departureSoon === true) return true;
  if (row.status === 'departed' || row.status === 'cancelled') return false;
  const departure = Date.parse(row.departureAt || row.depart || row.startsAt || '');
  return Number.isFinite(departure) && departure > Date.now() && departure <= Date.now() + 2 * 60 * 60_000;
}

export function listTours(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createTours(input = {}, actor = 'system') {
  const row = {
    id: rid('tour'),
    tourName: input.tourName !== undefined ? input.tourName : "Kekova",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    guide: input.guide || null,
    meetingPoint: input.meetingPoint || null,
    departureAt: input.departureAt || input.depart || null,
    pax: Number(input.pax ?? input.guests ?? 2) || 2,
    status: input.status || 'booked',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tours', row, 300);
  appendAudit({
    actor,
    action: 'tours.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateTours(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.pax !== undefined) next.pax = Number(next.pax) || 0;
  list[idx] = next;
  writeCollection('tours', list);
  appendAudit({ actor, action: 'tours.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function toursSummary() {
  const list = listTours();
  const departureSoon = list.filter(isDepartureSoon);
  const checkedIn = list.filter((x) => x.status === 'checked_in' || x.checkedInAt);
  const sunsetTours = list.filter((x) => x.sunsetTour === true || x.tourType === 'sunset');
  const flags = openToursFlags();
  return {
    title: 'LIKYA Tours Ops',
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    departed: list.filter((x) => x.status === 'departed').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length,
    checked_in: checkedIn.length,
    departureSoon: departureSoon.length,
    sunsetTours: sunsetTours.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      booked: list.filter((x) => x.status === 'booked').length,
      departed: list.filter((x) => x.status === 'departed').length,
      cancelled: list.filter((x) => x.status === 'cancelled').length,
      checked_in: checkedIn.length,
      departure_soon: departureSoon.length,
      sunset_tours: sunsetTours.length,
    },
    summaryLines: [
      `Tours ${list.length} booking - departure soon ${departureSoon.length} - checked in ${checkedIn.length}`,
      `Sunset tours ${sunsetTours.length} - departed ${list.filter((x) => x.status === 'departed').length} - flag ${flags.length}`,
    ],
    tours: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runToursSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = toursSummary();
  const created = [];
  const candidates = [];
  if (force || overview.departureSoon > 0) {
    candidates.push({
      key: 'tours_departure_soon',
      level: overview.departureSoon > 0 ? 'warn' : 'info',
      text: `Tours departure soon ${overview.departureSoon}`,
      domain: 'departure',
    });
  }
  if (force || overview.booked > overview.checked_in) {
    candidates.push({
      key: 'tours_checkin_queue',
      level: overview.booked > overview.checked_in ? 'info' : 'info',
      text: `Tour guest check-in queue ${overview.booked}`,
      domain: 'checkin',
    });
  }
  if (force || overview.sunsetTours > 0) {
    candidates.push({
      key: 'tours_sunset_manifest',
      level: 'info',
      text: `Sunset tours ${overview.sunsetTours}`,
      domain: 'sunset',
    });
  }
  for (const candidate of candidates) {
    const flag = addToursFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `tours sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('trs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('tours-sweeps', sweep, 80);
  appendAudit({ actor, action: 'tours.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: toursSummary() };
}

export function ackToursFlag(input = {}, actor = 'system') {
  const list = readCollection('tours-flags', []) || [];
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
  writeCollection('tours-flags', list);
  appendAudit({ actor, action: 'tours.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: toursSummary() };
}

export function markTourDepartureSoon(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.tourName && x.tourName === input.tourName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'booked' || x.status === 'checked_in');
  if (idx < 0) return { ok: false, error: 'Departure soon yapilacak tour yok' };
  list[idx] = {
    ...list[idx],
    status: 'departure_soon',
    departureSoon: true,
    departureAt: input.departureAt || input.depart || new Date(Date.now() + 45 * 60_000).toISOString(),
    departureSoonAt: input.departureSoonAt || new Date().toISOString(),
    departureSoonBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('tours', list);
  appendAudit({ actor, action: 'tours.departure_soon', detail: list[idx].tourName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, tour: list[idx], overview: toursSummary() };
}

export function checkInTourGuest(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'booked' || x.status === 'departure_soon');
  if (idx < 0) return { ok: false, error: 'Check-in yapilacak tour guest yok' };
  list[idx] = {
    ...list[idx],
    status: 'checked_in',
    checkedInAt: input.checkedInAt || new Date().toISOString(),
    checkedInBy: actor,
    meetingPoint: input.meetingPoint || list[idx].meetingPoint || 'Lobby',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('tours', list);
  appendAudit({ actor, action: 'tours.checkin_guest', detail: list[idx].guestName || list[idx].tourName, meta: { id: list[idx].id } });
  return { ok: true, tour: list[idx], overview: toursSummary() };
}

export function seedSunsetTour(input = {}, actor = 'system') {
  const tour = createTours(
    {
      tourName: input.tourName || 'Sunset Kekova',
      guestName: input.guestName || 'Sunset tour guest',
      guide: input.guide || 'Tour desk',
      meetingPoint: input.meetingPoint || 'Marina gate',
      departureAt: input.departureAt || new Date(Date.now() + 75 * 60_000).toISOString(),
      pax: Number(input.pax ?? input.guests ?? 6) || 6,
      status: input.status || 'booked',
    },
    actor,
  );
  updateTours(tour.id, { sunsetTour: true, tourType: 'sunset', manifestStatus: input.manifestStatus || 'open' }, actor);
  appendAudit({ actor, action: 'tours.seed_sunset_tour', detail: tour.tourName, meta: { id: tour.id } });
  return {
    ok: true,
    tour: { ...tour, sunsetTour: true, tourType: 'sunset', manifestStatus: input.manifestStatus || 'open' },
    overview: toursSummary(),
  };
}
