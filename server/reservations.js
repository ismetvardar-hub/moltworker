/**
 * AŞAMA 25 — Tesis rezervasyon / masa planı.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    today,
    todayCount: todayList.length,
    pending: all.filter((r) => r.status === 'pending').length,
    confirmed: all.filter((r) => r.status === 'confirmed').length,
    total: all.length,
  };
}
