/**
 * AŞAMA 25 — Tesis rezervasyon / masa planı.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_RESERVATIONS = () => {
  const day = todayIso();
  return [
    {
      id: 'res_1',
      date: day,
      time: '19:30',
      partySize: 4,
      guestName: 'Elena K.',
      phone: '+905551112233',
      venueId: 'venue_olympos_beach',
      brandId: 'brand_daze',
      table: 'T12',
      status: 'confirmed',
      note: 'Sahil tercihi',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'res_2',
      date: day,
      time: '20:00',
      partySize: 2,
      guestName: 'Mert A.',
      phone: null,
      venueId: 'venue_kaleici',
      brandId: 'brand_daze',
      table: 'T3',
      status: 'pending',
      note: '',
      createdAt: new Date().toISOString(),
    },
  ];
};

function ensureSeed() {
  const list = readCollection('reservations', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = DEFAULT_RESERVATIONS();
    writeCollection('reservations', seed);
    return seed;
  }
  return list;
}

export function listReservations(filter = {}) {
  let list = ensureSeed();
  if (filter.date) list = list.filter((r) => r.date === filter.date);
  if (filter.venueId) list = list.filter((r) => r.venueId === filter.venueId);
  if (filter.brandId) list = list.filter((r) => r.brandId === filter.brandId);
  if (filter.status) list = list.filter((r) => r.status === filter.status);
  return list.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function createReservation(input, actor = 'system') {
  const reservation = {
    id: `res_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    date: input.date || todayIso(),
    time: input.time || '19:00',
    partySize: Math.max(1, Number(input.partySize) || 2),
    guestName: String(input.guestName || '').trim() || 'Misafir',
    phone: input.phone || null,
    venueId: input.venueId || 'venue_olympos_beach',
    brandId: input.brandId || 'brand_daze',
    table: input.table || null,
    status: input.status || 'pending',
    note: input.note || '',
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('reservations', reservation, 300);
  appendAudit({
    actor,
    action: 'reservations.create',
    detail: `${reservation.guestName} ${reservation.date} ${reservation.time}`,
    meta: { id: reservation.id },
  });
  return reservation;
}

export function updateReservation(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const allowed = ['date', 'time', 'partySize', 'guestName', 'phone', 'venueId', 'brandId', 'table', 'status', 'note'];
  const next = { ...list[idx] };
  for (const k of allowed) {
    if (patch[k] !== undefined) next[k] = patch[k];
  }
  if (patch.partySize !== undefined) next.partySize = Math.max(1, Number(patch.partySize) || 1);
  next.updatedAt = new Date().toISOString();
  list[idx] = next;
  writeCollection('reservations', list);
  appendAudit({
    actor,
    action: 'reservations.update',
    detail: `${next.guestName} → ${next.status}`,
    meta: { id },
  });
  return next;
}

export function removeReservation(id, actor = 'system') {
  const r = ensureSeed().find((x) => x.id === id);
  if (!r) return null;
  deleteItem('reservations', id);
  appendAudit({
    actor,
    action: 'reservations.delete',
    detail: r.guestName,
    meta: { id },
  });
  return r;
}

export function reservationsSummary() {
  const today = todayIso();
  const all = listReservations();
  const todayList = all.filter((r) => r.date === today);
  const pending = all.filter((r) => r.status === 'pending').length;
  const confirmed = all.filter((r) => r.status === 'confirmed').length;
  const seated = all.filter((r) => r.status === 'seated' || r.status === 'completed').length;
  const cancelled = all.filter((r) => r.status === 'cancelled' || r.status === 'no_show').length;
  const flags = readCollection('reservations-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    today,
    todayCount: todayList.length,
    pending,
    confirmed,
    seated,
    cancelled,
    total: all.length,
    title: 'LİKYA Rezervasyon',
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      pending,
      confirmed,
      seated,
      today: todayList.length,
    },
    summaryLines: [
      `Bugün ${todayList.length} · bekleyen ${pending} · onaylı ${confirmed}`,
      `Reservations flag ${openFlags.length} açık`,
    ],
  };
}

export function runReservationsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = reservationsSummary();
  const existing = readCollection('reservations-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.pending || 0) > 0) {
    candidates.push({
      key: 'pending',
      level: 'warn',
      text: `Bekleyen rezervasyon ${o.pending || 0}`,
      domain: 'pending',
    });
  }
  if (force || (o.todayCount || 0) > 0) {
    candidates.push({
      key: 'today',
      level: 'info',
      text: `Bugünkü rezervasyon ${o.todayCount || 0}`,
      domain: 'today',
    });
  }
  if (force || (o.confirmed || 0) > 0) {
    candidates.push({
      key: 'confirmed',
      level: 'info',
      text: `Onaylı rezervasyon ${o.confirmed || 0}`,
      domain: 'confirmed',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Reservations heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('rsvf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('reservations-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `reservations sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('rsvs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('reservations-sweeps', sweep, 80);
  appendAudit({ actor, action: 'reservations.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: reservationsSummary() };
}

export function ackReservationsFlag(input = {}, actor = 'system') {
  const list = readCollection('reservations-flags', []) || [];
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
  writeCollection('reservations-flags', list);
  appendAudit({ actor, action: 'reservations.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: reservationsSummary() };
}

/** Mutator 1 — confirm pending reservations. */
export function confirmPendingReservations(input = {}, actor = 'system') {
  const rows = listReservations().filter((r) => r.status === 'pending');
  const confirmed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateReservation(row.id, { status: 'confirmed', note: input.note || row.note || 'confirmed' }, actor);
    if (next) confirmed.push(next.id);
  }
  if (!confirmed.length) {
    const seeded = createReservation(
      { guestName: 'rsv-seed pending', status: 'pending', note: 'confirm seed' },
      actor,
    );
    const next = updateReservation(seeded.id, { status: 'confirmed' }, actor);
    if (next) confirmed.push(next.id);
    else confirmed.push(seeded.id);
  }
  appendAudit({ actor, action: 'reservations.confirm_pending', detail: `${confirmed.length}`, meta: { n: confirmed.length } });
  return { ok: true, confirmed, overview: reservationsSummary() };
}

/** Mutator 2 — cancel / no-show. */
export function cancelNoShowReservations(input = {}, actor = 'system') {
  const status = input.status === 'cancelled' ? 'cancelled' : 'no_show';
  const rows = listReservations().filter(
    (r) => r.status === 'pending' || r.status === 'confirmed',
  );
  const cancelled = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateReservation(
      row.id,
      { status, note: input.note || row.note || status },
      actor,
    );
    if (next) cancelled.push(next.id);
  }
  if (!cancelled.length) {
    const seeded = createReservation(
      { guestName: 'rsv-seed noshow', status: 'confirmed', note: 'no-show seed' },
      actor,
    );
    const next = updateReservation(seeded.id, { status }, actor);
    if (next) cancelled.push(next.id);
    else cancelled.push(seeded.id);
  }
  appendAudit({ actor, action: 'reservations.cancel_noshow', detail: `${cancelled.length}`, meta: { n: cancelled.length, status } });
  return { ok: true, cancelled, status, overview: reservationsSummary() };
}

/** Mutator 3 — seat / assign table or complete. */
export function seatAssignReservations(input = {}, actor = 'system') {
  const complete = !!input.complete;
  const status = complete ? 'completed' : 'seated';
  const rows = listReservations().filter(
    (r) => r.status === 'confirmed' || r.status === 'pending' || r.status === 'seated',
  );
  const seated = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const table = input.table || row.table || `T${(Math.floor(Math.random() * 20) + 1)}`;
    const next = updateReservation(
      row.id,
      { status, table, note: input.note || row.note || status },
      actor,
    );
    if (next) seated.push(next.id);
  }
  if (!seated.length) {
    const seeded = createReservation(
      { guestName: 'rsv-seed seat', status: 'confirmed', table: 'T99', note: 'seat seed' },
      actor,
    );
    const next = updateReservation(seeded.id, { status, table: input.table || 'T99' }, actor);
    if (next) seated.push(next.id);
    else seated.push(seeded.id);
  }
  appendAudit({ actor, action: 'reservations.seat_assign', detail: `${seated.length}`, meta: { n: seated.length, status } });
  return { ok: true, seated, status, overview: reservationsSummary() };
}
