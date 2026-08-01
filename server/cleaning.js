/**
 * AŞAMA 65 — Temizlik Görevleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('cleaning-tasks', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "cln_1",
    "area": "VIP tuvalet",
    "venueId": "venue_olympos_beach",
    "status": "open",
    "priority": "high"
  }
];
    writeCollection('cleaning-tasks', seed);
    return seed;
  }
  return list;
}

export function listCleaning(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createCleaning(input, actor = 'system') {
  const row = {
    id: `cle_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"area":"Salon","priority":"normal"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"area":"Salon","priority":"normal"}[k]];
    })),
    status: input.status || 'open',
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
  
  prependItem('cleaning-tasks', row, 300);
  appendAudit({ actor, action: 'cleaning.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateCleaning(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cleaning-tasks', list);
  appendAudit({ actor, action: 'cleaning.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function cleaningSummary() {
  const list = listCleaning();
  return {
    total: list.length,
    open: list.filter((x) => x.status === 'open').length,
    done: list.filter((x) => x.status === 'done').length,
    tasks: list,
  };
}
