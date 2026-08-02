import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 177 - Open-air cinema ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('cinema', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'cin_1',
      film: "Gece Filmi",
      seats: "80",
      status: 'scheduled',
      at: new Date().toISOString(),
    }];
    writeCollection('cinema', seed);
    return seed;
  }
  return list;
}

function openCinemaFlags() {
  const flags = readCollection('cinema-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addCinemaFlag(candidate, actor = 'system') {
  const existing = readCollection('cinema-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('cnf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('cinema-flags', list.slice(0, 200));
  return flag;
}

function isShowtimeConflict(row) {
  return row.showtimeConflict === true || row.status === 'conflict' || Boolean(row.conflictAt);
}

function isHouseSeated(row) {
  return row.houseSeated === true || row.status === 'soldout' || row.status === 'seated' || Number(row.seatsFilled ?? 0) >= Number(row.seats ?? 1);
}

function isPremiere(row) {
  return row.premiere === true || row.eventType === 'premiere';
}

export function listCinema(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createCinema(input = {}, actor = 'system') {
  const row = {
    id: rid('cin'),
    film: input.film !== undefined ? input.film : "Gece Filmi",
    seats: input.seats !== undefined ? Number(input.seats) || 0 : 80,
    slot: input.slot !== undefined ? input.slot : undefined,
    eventType: input.eventType !== undefined ? input.eventType : undefined,
    premiere: input.premiere === true || undefined,
    status: input.status || 'scheduled',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cinema', row, 300);
  appendAudit({
    actor,
    action: 'cinema.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateCinema(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.seats !== undefined) next.seats = Number(next.seats) || 0;
  if (next.seatsFilled !== undefined) next.seatsFilled = Number(next.seatsFilled) || 0;
  list[idx] = next;
  writeCollection('cinema', list);
  appendAudit({ actor, action: 'cinema.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function cinemaSummary() {
  const list = listCinema();
  const showtimeConflicts = list.filter(isShowtimeConflict);
  const houseSeated = list.filter(isHouseSeated);
  const premieres = list.filter(isPremiere);
  const flags = openCinemaFlags();
  return {
    title: 'LIKYA Cinema Ops',
    total: list.length,
    scheduled: list.filter((x) => x.status === 'scheduled').length,
    soldout: list.filter((x) => x.status === 'soldout').length,
    done: list.filter((x) => x.status === 'done').length,
    showtimeConflicts: showtimeConflicts.length,
    houseSeated: houseSeated.length,
    premieres: premieres.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      scheduled: list.filter((x) => x.status === 'scheduled').length,
      soldout: list.filter((x) => x.status === 'soldout').length,
      done: list.filter((x) => x.status === 'done').length,
      showtime_conflicts: showtimeConflicts.length,
      house_seated: houseSeated.length,
      premieres: premieres.length,
    },
    summaryLines: [
      `Cinema ${list.length} show - conflicts ${showtimeConflicts.length} - seated house ${houseSeated.length}`,
      `Scheduled ${list.filter((x) => x.status === 'scheduled').length} - premieres ${premieres.length} - flag ${flags.length}`,
    ],
    cinema: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runCinemaSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = cinemaSummary();
  const created = [];
  const candidates = [];
  if (force || overview.showtimeConflicts > 0) {
    candidates.push({
      key: 'cinema_showtime_conflict',
      level: overview.showtimeConflicts > 0 ? 'warn' : 'info',
      text: `Cinema showtime conflicts ${overview.showtimeConflicts}`,
      domain: 'showtime',
    });
  }
  if (force || overview.houseSeated === 0) {
    candidates.push({
      key: 'cinema_house_seat_needed',
      level: overview.houseSeated === 0 ? 'warn' : 'info',
      text: `Cinema seated houses ${overview.houseSeated}`,
      domain: 'seating',
    });
  }
  if (force || overview.premieres === 0) {
    candidates.push({
      key: 'cinema_premiere_seed',
      level: 'info',
      text: `Cinema premieres ${overview.premieres}`,
      domain: 'premiere',
    });
  }
  for (const candidate of candidates) {
    const flag = addCinemaFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `cinema sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('cns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('cinema-sweeps', sweep, 80);
  appendAudit({ actor, action: 'cinema.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: cinemaSummary() };
}

export function ackCinemaFlag(input = {}, actor = 'system') {
  const list = readCollection('cinema-flags', []) || [];
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
  writeCollection('cinema-flags', list);
  appendAudit({ actor, action: 'cinema.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: cinemaSummary() };
}

export function markCinemaShowtimeConflict(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.film && x.film === input.film));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isShowtimeConflict(x));
  if (idx < 0) return { ok: false, error: 'Showtime conflict yapilacak cinema yok' };
  list[idx] = {
    ...list[idx],
    status: 'conflict',
    showtimeConflict: true,
    conflictReason: input.reason || input.conflictReason || 'screen_overlap',
    conflictAt: input.conflictAt || new Date().toISOString(),
    conflictBy: actor,
    slot: input.slot || list[idx].slot || '21:00',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('cinema', list);
  appendAudit({ actor, action: 'cinema.showtime_conflict', detail: list[idx].film || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, show: list[idx], overview: cinemaSummary() };
}

export function seatCinemaHouse(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.film && x.film === input.film));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'scheduled' || isShowtimeConflict(x));
  if (idx < 0) return { ok: false, error: 'Seat edilecek cinema house yok' };
  const seats = Number(input.seats ?? list[idx].seats ?? 80) || 80;
  list[idx] = {
    ...list[idx],
    status: input.status || 'soldout',
    showtimeConflict: false,
    houseSeated: true,
    seats,
    seatsFilled: Number(input.seatsFilled ?? seats) || seats,
    seatedAt: input.seatedAt || new Date().toISOString(),
    seatedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('cinema', list);
  appendAudit({ actor, action: 'cinema.seat_house', detail: list[idx].film || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, show: list[idx], overview: cinemaSummary() };
}

export function seedPremiere(input = {}, actor = 'system') {
  const show = createCinema(
    {
      film: input.film || 'Wave 177 Premiere',
      seats: Number(input.seats ?? 120) || 120,
      slot: input.slot || '21:30',
      eventType: 'premiere',
      premiere: true,
      status: input.status || 'scheduled',
    },
    actor,
  );
  appendAudit({ actor, action: 'cinema.seed_premiere', detail: show.film, meta: { id: show.id } });
  return { ok: true, show, overview: cinemaSummary() };
}
