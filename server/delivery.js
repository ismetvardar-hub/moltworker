/**
 * AŞAMA 64 — Paket / Teslimat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('delivery-orders', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "del_1",
    "guestName": "Mert A.",
    "items": "Köfte menü x2",
    "status": "preparing",
    "venueId": "venue_kaleici"
  }
];
    writeCollection('delivery-orders', seed);
    return seed;
  }
  return list;
}

export function listDelivery(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createDelivery(input, actor = 'system') {
  const row = {
    id: `del_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"guestName":"Misafir","items":"Ayran x2"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"guestName":"Misafir","items":"Ayran x2"}[k]];
    })),
    status: input.status || 'preparing',
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
  
  prependItem('delivery-orders', row, 300);
  appendAudit({ actor, action: 'delivery.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateDelivery(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('delivery-orders', list);
  appendAudit({ actor, action: 'delivery.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function deliverySummary() {
  const list = listDelivery();
  return {
    total: list.length,
    preparing: list.filter((x) => x.status === 'preparing').length,
    ready: list.filter((x) => x.status === 'ready').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    orders: list,
  };
}
