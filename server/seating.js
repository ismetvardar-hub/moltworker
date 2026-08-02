/**
 * AŞAMA 54 — Masa / oturma durumu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const VALID_STATUSES = new Set(['free', 'occupied', 'reserved']);

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function cleanStatus(status) {
  return VALID_STATUSES.has(status) ? status : 'free';
}

function hoursOld(iso) {
  const t = Date.parse(iso || 0);
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 3600_000;
}

function ensure() {
  let list = readCollection('seating', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      { id: 'tbl_t3', label: 'T3', seats: 2, venueId: 'venue_kaleici', status: 'free' },
      { id: 'tbl_t12', label: 'T12', seats: 4, venueId: 'venue_olympos_beach', status: 'reserved' },
      { id: 'tbl_t7', label: 'T7', seats: 6, venueId: 'venue_olympos_beach', status: 'occupied' },
      { id: 'tbl_b2', label: 'B2', seats: 2, venueId: 'venue_olympos_beach', status: 'free' },
    ];
    writeCollection('seating', list);
  }
  return list;
}

export function listSeating(filter = {}) {
  let list = ensure();
  if (filter.venueId) list = list.filter((t) => t.venueId === filter.venueId);
  if (filter.status) list = list.filter((t) => t.status === filter.status);
  return list;
}

export function updateSeat(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (patch.status !== undefined) next.status = cleanStatus(patch.status);
  list[idx] = next;
  writeCollection('seating', list);
  appendAudit({
    actor,
    action: 'seating.update',
    detail: `${list[idx].label} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function createSeat(input, actor = 'system') {
  const seat = {
    id: `tbl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    label: String(input.label || '').trim() || 'T?',
    seats: Math.max(1, Number(input.seats) || 2),
    venueId: input.venueId || 'venue_olympos_beach',
    status: cleanStatus(input.status || 'free'),
    partyName: input.partyName || undefined,
    partySize: input.partySize ? Math.max(1, Number(input.partySize) || 1) : undefined,
    reservationId: input.reservationId || undefined,
    createdAt: new Date().toISOString(),
  };
  prependItem('seating', seat, 200);
  appendAudit({ actor, action: 'seating.create', detail: seat.label, meta: { id: seat.id } });
  return seat;
}

export function seatingSummary() {
  const list = listSeating();
  const flags = readCollection('seating-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const occupiedTooLong = list.filter(
    (t) => t.status === 'occupied' && hoursOld(t.occupiedAt || t.seatedAt || t.updatedAt || t.createdAt) >= 3,
  );
  const reservedWithoutParty = list.filter(
    (t) => t.status === 'reserved' && !t.partyName && !t.partySize && !t.reservationId,
  );
  const invalidStatus = list.filter((t) => !VALID_STATUSES.has(t.status));
  return {
    title: 'LİKYA Oturma Ops',
    total: list.length,
    free: list.filter((t) => t.status === 'free').length,
    occupied: list.filter((t) => t.status === 'occupied').length,
    reserved: list.filter((t) => t.status === 'reserved').length,
    occupiedTooLong: occupiedTooLong.length,
    reservedWithoutParty: reservedWithoutParty.length,
    invalidStatus: invalidStatus.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      free: list.filter((t) => t.status === 'free').length,
      occupied: list.filter((t) => t.status === 'occupied').length,
      reserved: list.filter((t) => t.status === 'reserved').length,
      occupied_too_long: occupiedTooLong.length,
      reserved_without_party: reservedWithoutParty.length,
      invalid_status: invalidStatus.length,
    },
    summaryLines: [
      `Masa ${list.length} · free ${list.filter((t) => t.status === 'free').length} · occupied ${list.filter((t) => t.status === 'occupied').length} · reserved ${list.filter((t) => t.status === 'reserved').length}`,
      `Uzun oturum ${occupiedTooLong.length} · partisiz rezerv ${reservedWithoutParty.length} · seating flag ${openFlags.length} açık`,
    ],
  };
}

export function runSeatingSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = seatingSummary();
  const existing = readCollection('seating-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.occupiedTooLong || 0) > 0) {
    candidates.push({
      key: 'seating_occupied_too_long',
      level: (overview.occupiedTooLong || 0) > 0 ? 'warn' : 'info',
      text: `Uzun süre occupied masa ${overview.occupiedTooLong || 0}`,
      domain: 'turnover',
    });
  }
  if (force || (overview.reservedWithoutParty || 0) > 0) {
    candidates.push({
      key: 'seating_reserved_without_party',
      level: (overview.reservedWithoutParty || 0) > 0 ? 'warn' : 'info',
      text: `Partisiz reserved masa ${overview.reservedWithoutParty || 0}`,
      domain: 'reservations',
    });
  }
  if (force || (overview.invalidStatus || 0) > 0) {
    candidates.push({
      key: 'seating_status_hygiene',
      level: (overview.invalidStatus || 0) > 0 ? 'alert' : 'info',
      text: `Geçersiz masa status ${overview.invalidStatus || 0}`,
      domain: 'status',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('seatf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('seating-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'DAZE-HUB',
        title: `seating sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('seats'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('seating-sweeps', sweep, 80);
  appendAudit({ actor, action: 'seating.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: seatingSummary() };
}

export function ackSeatingFlag(input = {}, actor = 'system') {
  const list = readCollection('seating-flags', []) || [];
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
  writeCollection('seating-flags', list);
  appendAudit({ actor, action: 'seating.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: seatingSummary() };
}

/** Mutator 1 — seat a walk-in party at a free/reserved table. */
export function seatWalkInParty(input = {}, actor = 'system') {
  let target = null;
  if (input.id) target = ensure().find((t) => t.id === input.id);
  if (!target) target = listSeating().find((t) => t.status === 'free') || listSeating().find((t) => t.status === 'reserved') || listSeating()[0];
  if (!target) return { ok: false, error: 'Masa yok' };
  const occupiedAt = input.hours
    ? new Date(Date.now() - Number(input.hours) * 3600_000).toISOString()
    : new Date().toISOString();
  const table = updateSeat(
    target.id,
    {
      status: 'occupied',
      partyName: input.partyName || input.name || 'Walk-in',
      partySize: Math.max(1, Number(input.partySize) || Number(target.seats) || 2),
      occupiedAt,
      reservationId: input.reservationId || target.reservationId,
    },
    actor,
  );
  appendAudit({ actor, action: 'seating.walk_in', detail: table?.label || target.label, meta: { id: target.id } });
  return { ok: true, table, seated: table ? [table.id] : [], overview: seatingSummary() };
}

/** Mutator 2 — clear an occupied/invalid table back to free. */
export function clearSeatingTable(input = {}, actor = 'system') {
  let target = null;
  if (input.id) target = ensure().find((t) => t.id === input.id);
  if (!target) target = listSeating().find((t) => !VALID_STATUSES.has(t.status)) || listSeating().find((t) => t.status === 'occupied') || listSeating()[0];
  if (!target) return { ok: false, error: 'Masa yok' };
  const table = updateSeat(
    target.id,
    {
      status: 'free',
      partyName: undefined,
      partySize: undefined,
      reservationId: undefined,
      occupiedAt: undefined,
      reservedAt: undefined,
      clearedAt: new Date().toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'seating.clear', detail: table?.label || target.label, meta: { id: target.id } });
  return { ok: true, table, cleared: table ? [table.id] : [], overview: seatingSummary() };
}

/** Mutator 3 — reserve a free table with party context. */
export function reserveSeatingTable(input = {}, actor = 'system') {
  let target = null;
  if (input.id) target = ensure().find((t) => t.id === input.id);
  if (!target) target = listSeating().find((t) => t.status === 'free') || listSeating()[0];
  if (!target) return { ok: false, error: 'Masa yok' };
  const table = updateSeat(
    target.id,
    {
      status: 'reserved',
      partyName: input.partyName || input.name || 'Rezervasyon',
      partySize: Math.max(1, Number(input.partySize) || Number(target.seats) || 2),
      reservationId: input.reservationId || `res_${Date.now().toString(36)}`,
      reservedAt: new Date().toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'seating.reserve', detail: table?.label || target.label, meta: { id: target.id } });
  return { ok: true, table, reserved: table ? [table.id] : [], overview: seatingSummary() };
}
