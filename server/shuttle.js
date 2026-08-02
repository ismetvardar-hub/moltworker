/**
 * AŞAMA 87 — Shuttle Saatleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const ACTIVE_STATUSES = new Set(['scheduled', 'boarding', 'running', 'late']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('shuttle-runs', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'shu_1',
      route: "Beach↔Kaleiçi",
      depart: "10:00",
      capacity: 12,
      boarded: 0,
      status: 'scheduled',
      at: new Date().toISOString(),
    }];
    writeCollection('shuttle-runs', seed);
    return seed;
  }
  return list;
}

function departMinutes(row) {
  const value = String(row.depart || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!value) return null;
  return Number(value[1]) * 60 + Number(value[2]);
}

function isLateDeparture(row) {
  if (row.status === 'late') return true;
  if (!ACTIVE_STATUSES.has(row.status)) return false;
  const mins = departMinutes(row);
  if (mins == null) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins - mins > 10;
}

function openShuttleFlags() {
  const flags = readCollection('shuttle-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addShuttleFlag(candidate, actor = 'system') {
  const existing = readCollection('shuttle-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('shf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('shuttle-flags', list.slice(0, 200));
  return flag;
}

export function listShuttle(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createShuttle(input = {}, actor = 'system') {
  const row = {
    id: `shu_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    route: input.route !== undefined ? input.route : "Beach↔Kaleiçi",
    depart: input.depart !== undefined ? input.depart : "10:00",
    capacity: input.capacity !== undefined ? Number(input.capacity) || 0 : 12,
    boarded: input.boarded !== undefined ? Number(input.boarded) || 0 : 0,
    driver: input.driver || null,
    vehicle: input.vehicle || null,
    delayMinutes: input.delayMinutes !== undefined ? Number(input.delayMinutes) || 0 : 0,
    status: input.status || 'scheduled',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shuttle-runs', row, 300);
  appendAudit({
    actor,
    action: 'shuttle.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateShuttle(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  for (const key of ['capacity', 'boarded', 'delayMinutes']) {
    if (next[key] !== undefined) next[key] = Number(next[key]) || 0;
  }
  list[idx] = next;
  writeCollection('shuttle-runs', list);
  appendAudit({ actor, action: 'shuttle.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function shuttleSummary() {
  const list = listShuttle();
  const late = list.filter(isLateDeparture);
  const boarding = list.filter((x) => x.status === 'boarding');
  const boardedGuests = list.reduce((sum, x) => sum + Number(x.boarded || 0), 0);
  const flags = openShuttleFlags();
  return {
    title: 'LİKYA Shuttle Ops',
    total: list.length,
    scheduled: list.filter((x) => x.status === 'scheduled').length,
    boarding: boarding.length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length,
    late: late.length,
    boardedGuests,
    active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      scheduled: list.filter((x) => x.status === 'scheduled').length,
      boarding: boarding.length,
      running: list.filter((x) => x.status === 'running').length,
      done: list.filter((x) => x.status === 'done').length,
      late: late.length,
      boarded_guests: boardedGuests,
      active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    },
    summaryLines: [
      `Shuttle ${list.length} route · scheduled ${list.filter((x) => x.status === 'scheduled').length} · late ${late.length}`,
      `Boarding ${boarding.length} · boarded ${boardedGuests} · flag ${flags.length}`,
    ],
    runs: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runShuttleSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = shuttleSummary();
  const created = [];
  const candidates = [];
  if (force || overview.late > 0) {
    candidates.push({
      key: 'shuttle_late_departures',
      level: overview.late > 0 ? 'warn' : 'info',
      text: `Late shuttle departure ${overview.late}`,
      domain: 'departure',
    });
  }
  if (force || overview.boarding > 0) {
    candidates.push({
      key: 'shuttle_boarding_active',
      level: 'info',
      text: `Boarding shuttle route ${overview.boarding}`,
      domain: 'boarding',
    });
  }
  if (force || overview.scheduled > 0) {
    candidates.push({
      key: 'shuttle_scheduled_routes',
      level: overview.scheduled > 8 ? 'warn' : 'info',
      text: `Scheduled shuttle route ${overview.scheduled}`,
      domain: 'route',
    });
  }
  for (const candidate of candidates) {
    const flag = addShuttleFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HERMES',
        title: `shuttle sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('shs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('shuttle-sweeps', sweep, 80);
  appendAudit({ actor, action: 'shuttle.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: shuttleSummary() };
}

export function ackShuttleFlag(input = {}, actor = 'system') {
  const list = readCollection('shuttle-flags', []) || [];
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
  writeCollection('shuttle-flags', list);
  appendAudit({ actor, action: 'shuttle.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: shuttleSummary() };
}

export function markShuttleLateDeparture(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'scheduled' || x.status === 'boarding' || x.status === 'running');
  if (idx < 0) return { ok: false, error: 'Late departure işaretlenecek shuttle yok' };
  const delayMinutes = Number(input.delayMinutes ?? input.minutes ?? 15) || 15;
  list[idx] = {
    ...list[idx],
    status: 'late',
    delayMinutes,
    lateReason: input.reason || input.lateReason || 'Ops late departure',
    lateAt: input.lateAt || new Date().toISOString(),
    lateBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('shuttle-runs', list);
  appendAudit({ actor, action: 'shuttle.late_departure', detail: list[idx].route || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, run: list[idx], overview: shuttleSummary() };
}

export function boardShuttleGuests(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Board edilecek shuttle yok' };
  const guests = Number(input.guests ?? input.boarded ?? 2) || 2;
  const boarded = Math.max(0, Number(list[idx].boarded || 0) + guests);
  list[idx] = {
    ...list[idx],
    status: boarded >= Number(list[idx].capacity || 0) && Number(list[idx].capacity || 0) > 0 ? 'running' : 'boarding',
    boarded,
    boardedAt: input.boardedAt || new Date().toISOString(),
    boardedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('shuttle-runs', list);
  appendAudit({ actor, action: 'shuttle.board_guests', detail: `${list[idx].route || list[idx].id} +${guests}`, meta: { id: list[idx].id } });
  return { ok: true, run: list[idx], guests, overview: shuttleSummary() };
}

export function seedShuttleRoute(input = {}, actor = 'system') {
  const run = createShuttle(
    {
      route: input.route || 'Lobby-Airport',
      depart: input.depart || '18:30',
      capacity: Number(input.capacity ?? 14),
      boarded: Number(input.boarded ?? 0),
      driver: input.driver || 'Ops shuttle',
      vehicle: input.vehicle || 'Shuttle-2',
      status: input.status || 'scheduled',
    },
    actor,
  );
  appendAudit({ actor, action: 'shuttle.seed_route', detail: run.route, meta: { id: run.id } });
  return { ok: true, run, overview: shuttleSummary() };
}
