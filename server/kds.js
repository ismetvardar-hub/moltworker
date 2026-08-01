/**
 * AŞAMA 73 — Mutfak Ekranı (KDS).
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('kds-tickets', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "kds_1",
    "ticket": "A-17",
    "items": "Köfte menü",
    "status": "bump",
    "etaMin": 4
  }
];
    writeCollection('kds-tickets', seed);
    return seed;
  }
  return list;
}

export function listKds(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createKds(input, actor = 'system') {
  const row = {
    id: `kds_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"ticket":"B-01","items":"Ayran","etaMin":"3"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"ticket":"B-01","items":"Ayran","etaMin":"3"}[k]];
    })),
    status: input.status || 'bump',
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
  
  prependItem('kds-tickets', row, 300);
  appendAudit({ actor, action: 'kds.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateKds(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('kds-tickets', list);
  appendAudit({ actor, action: 'kds.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function kdsSummary() {
  const list = listKds();
  return {
    total: list.length,
    bump: list.filter((x) => x.status === 'bump').length,
    cooking: list.filter((x) => x.status === 'cooking').length,
    ready: list.filter((x) => x.status === 'ready').length,
    tickets: list,
  };
}
