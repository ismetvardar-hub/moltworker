/**
 * AŞAMA 61 — Spa / Wellness.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('spa-bookings', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "spa_1",
    "guestName": "Elena K.",
    "service": "Masaj 60dk",
    "at": "2026-08-01T14:00:00.000Z",
    "status": "booked",
    "venueId": "venue_olympos_beach"
  }
];
    writeCollection('spa-bookings', seed);
    return seed;
  }
  return list;
}

export function listSpa(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createSpa(input, actor = 'system') {
  const row = {
    id: `spa_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"guestName":"Misafir","service":"Masaj 60dk"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"guestName":"Misafir","service":"Masaj 60dk"}[k]];
    })),
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  if (row.qty !== undefined) row.qty = Number(row.qty) || 0;
  if (row.minutes !== undefined) row.minutes = Number(row.minutes) || 0;
  if (row.score !== undefined) row.score = Number(row.score) || 0;
  if (row.planned !== undefined) row.planned = Number(row.planned) || 0;
  if (row.actual !== undefined) row.actual = Number(row.actual) || 0;
  if (row.balance !== undefined) row.balance = Number(row.balance) || 0;
  if (row.etaMin !== undefined) row.etaMin = Number(row.etaMin) || 0;
  if (row.minQty !== undefined) row.minQty = Number(row.minQty) || 0;
  if (row.partySize !== undefined) row.partySize = Number(row.partySize) || 0;
  if (row.costTry !== undefined) row.costTry = Number(row.costTry) || 0;
  if (row.seats !== undefined) row.seats = Number(row.seats) || 0;
  
  prependItem('spa-bookings', row, 300);
  appendAudit({ actor, action: 'spa.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateSpa(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('spa-bookings', list);
  appendAudit({ actor, action: 'spa.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function spaSummary() {
  const list = listSpa();
  return {
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    done: list.filter((x) => x.status === 'done').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length,
    bookings: list,
  };
}
