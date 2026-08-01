/**
 * AŞAMA 69 — Ekip Nabız.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('staff-pulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "pls_1",
    "score": 8,
    "note": "İyi tempo",
    "person": "Selin M.",
    "at": "2026-08-01T09:05:05.946Z"
  }
];
    writeCollection('staff-pulse', seed);
    return seed;
  }
  return list;
}

export function listPulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createPulse(input, actor = 'system') {
  const row = {
    id: `pul_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"score":"8","note":"Not","person":"Personel"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"score":"8","note":"Not","person":"Personel"}[k]];
    })),
    status: input.status || null,
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
  delete row.status;
  prependItem('staff-pulse', row, 300);
  appendAudit({ actor, action: 'pulse.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updatePulse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('staff-pulse', list);
  appendAudit({ actor, action: 'pulse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function pulseSummary() {
  const list = listPulse();
  return {
    total: list.length,
    
    entries: list,
  };
}
