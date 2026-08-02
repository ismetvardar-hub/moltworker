import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 177 - Dawn service tray ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('dawnservice', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'dwn_1',
      room: "102",
      item: "Espresso",
      status: 'queued',
      at: new Date().toISOString(),
    }];
    writeCollection('dawnservice', seed);
    return seed;
  }
  return list;
}

function openDawnserviceFlags() {
  const flags = readCollection('dawnservice-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addDawnserviceFlag(candidate, actor = 'system') {
  const existing = readCollection('dawnservice-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('dwf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('dawnservice-flags', list.slice(0, 200));
  return flag;
}

function isMissedTray(row) {
  return row.missedTray === true || row.status === 'missed' || Boolean(row.missedAt);
}

function isCompletedRound(row) {
  return row.roundComplete === true || row.status === 'delivered' || Boolean(row.completedAt);
}

function isSunriseAmenity(row) {
  return row.sunriseAmenity === true || row.amenityType === 'sunrise';
}

export function listDawnservice(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createDawnservice(input = {}, actor = 'system') {
  const row = {
    id: rid('dwn'),
    room: input.room !== undefined ? input.room : "102",
    item: input.item !== undefined ? input.item : "Espresso",
    round: input.round !== undefined ? input.round : undefined,
    amenityType: input.amenityType !== undefined ? input.amenityType : undefined,
    dueAt: input.dueAt !== undefined ? input.dueAt : undefined,
    sunriseAmenity: input.sunriseAmenity === true || undefined,
    status: input.status || 'queued',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dawnservice', row, 300);
  appendAudit({
    actor,
    action: 'dawnservice.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateDawnservice(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dawnservice', list);
  appendAudit({ actor, action: 'dawnservice.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function dawnserviceSummary() {
  const list = listDawnservice();
  const missedTrays = list.filter(isMissedTray);
  const completedRounds = list.filter(isCompletedRound);
  const sunriseAmenities = list.filter(isSunriseAmenity);
  const flags = openDawnserviceFlags();
  return {
    title: 'LIKYA Dawn Service Ops',
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    skipped: list.filter((x) => x.status === 'skipped').length,
    missedTrays: missedTrays.length,
    completedRounds: completedRounds.length,
    sunriseAmenities: sunriseAmenities.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      queued: list.filter((x) => x.status === 'queued').length,
      delivered: list.filter((x) => x.status === 'delivered').length,
      skipped: list.filter((x) => x.status === 'skipped').length,
      missed_trays: missedTrays.length,
      completed_rounds: completedRounds.length,
      sunrise_amenities: sunriseAmenities.length,
    },
    summaryLines: [
      `Dawn service ${list.length} tray - missed ${missedTrays.length} - rounds ${completedRounds.length}`,
      `Queued ${list.filter((x) => x.status === 'queued').length} - sunrise amenities ${sunriseAmenities.length} - flag ${flags.length}`,
    ],
    dawnservice: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runDawnserviceSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = dawnserviceSummary();
  const created = [];
  const candidates = [];
  if (force || overview.missedTrays > 0) {
    candidates.push({
      key: 'dawnservice_missed_tray',
      level: overview.missedTrays > 0 ? 'warn' : 'info',
      text: `Dawn service missed trays ${overview.missedTrays}`,
      domain: 'tray',
    });
  }
  if (force || overview.completedRounds === 0) {
    candidates.push({
      key: 'dawnservice_round_complete_needed',
      level: overview.completedRounds === 0 ? 'warn' : 'info',
      text: `Dawn service completed rounds ${overview.completedRounds}`,
      domain: 'round',
    });
  }
  if (force || overview.sunriseAmenities === 0) {
    candidates.push({
      key: 'dawnservice_sunrise_amenity_seed',
      level: 'info',
      text: `Dawn service sunrise amenities ${overview.sunriseAmenities}`,
      domain: 'amenity',
    });
  }
  for (const candidate of candidates) {
    const flag = addDawnserviceFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `dawnservice sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('dws'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('dawnservice-sweeps', sweep, 80);
  appendAudit({ actor, action: 'dawnservice.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: dawnserviceSummary() };
}

export function ackDawnserviceFlag(input = {}, actor = 'system') {
  const list = readCollection('dawnservice-flags', []) || [];
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
  writeCollection('dawnservice-flags', list);
  appendAudit({ actor, action: 'dawnservice.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: dawnserviceSummary() };
}

export function markDawnserviceMissedTray(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isMissedTray(x));
  if (idx < 0) return { ok: false, error: 'Missed tray yapilacak dawnservice yok' };
  list[idx] = {
    ...list[idx],
    status: 'missed',
    missedTray: true,
    dueAt: input.dueAt || new Date(Date.now() - 20 * 60_000).toISOString(),
    missedReason: input.reason || input.missedReason || 'room_not_reached',
    missedAt: input.missedAt || new Date().toISOString(),
    missedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('dawnservice', list);
  appendAudit({ actor, action: 'dawnservice.missed_tray', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, tray: list[idx], overview: dawnserviceSummary() };
}

export function completeDawnserviceRound(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isMissedTray(x) || x.status === 'queued');
  if (idx < 0) return { ok: false, error: 'Complete edilecek dawnservice round yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'delivered',
    missedTray: false,
    roundComplete: true,
    round: input.round || list[idx].round || 'sunrise',
    completedAt: input.completedAt || new Date().toISOString(),
    completedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('dawnservice', list);
  appendAudit({ actor, action: 'dawnservice.round_complete', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, tray: list[idx], overview: dawnserviceSummary() };
}

export function seedSunriseAmenity(input = {}, actor = 'system') {
  const tray = createDawnservice(
    {
      room: input.room || '177',
      item: input.item || 'Sunrise amenity tray',
      round: input.round || 'sunrise',
      amenityType: 'sunrise',
      sunriseAmenity: true,
      dueAt: input.dueAt || new Date(Date.now() + 30 * 60_000).toISOString(),
      status: input.status || 'queued',
    },
    actor,
  );
  appendAudit({ actor, action: 'dawnservice.seed_sunrise_amenity', detail: tray.room, meta: { id: tray.id } });
  return { ok: true, tray, overview: dawnserviceSummary() };
}
