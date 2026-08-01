/**
 * AŞAMA 66 — Çamaşırhane.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('laundry-batches', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "lau_1",
    "item": "Şef önlüğü",
    "qty": 12,
    "status": "washing",
    "venueId": "venue_kaleici"
  }
];
    writeCollection('laundry-batches', seed);
    return seed;
  }
  return list;
}

export function listLaundry(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createLaundry(input, actor = 'system') {
  const row = {
    id: `lau_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"item":"Peçete","qty":"20"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"item":"Peçete","qty":"20"}[k]];
    })),
    status: input.status || 'washing',
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
  
  prependItem('laundry-batches', row, 300);
  appendAudit({ actor, action: 'laundry.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateLaundry(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('laundry-batches', list);
  appendAudit({ actor, action: 'laundry.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function laundrySummary() {
  const list = listLaundry();
  return {
    total: list.length,
    washing: list.filter((x) => x.status === 'washing').length,
    ready: list.filter((x) => x.status === 'ready').length,
    returned: list.filter((x) => x.status === 'returned').length,
    batches: list,
  };
}
