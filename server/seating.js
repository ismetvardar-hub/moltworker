/**
 * AŞAMA 54 — Masa / oturma durumu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
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
    status: input.status || 'free',
  };
  prependItem('seating', seat, 200);
  appendAudit({ actor, action: 'seating.create', detail: seat.label, meta: { id: seat.id } });
  return seat;
}

export function seatingSummary() {
  const list = listSeating();
  return {
    total: list.length,
    free: list.filter((t) => t.status === 'free').length,
    occupied: list.filter((t) => t.status === 'occupied').length,
    reserved: list.filter((t) => t.status === 'reserved').length,
  };
}
