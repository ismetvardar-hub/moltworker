/**
 * AŞAMA 70 — Bütçe Kalemleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('budget-lines', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "bud_1",
    "label": "Mutfak malzeme",
    "planned": 120000,
    "actual": 45000,
    "period": "2026-08"
  }
];
    writeCollection('budget-lines', seed);
    return seed;
  }
  return list;
}

export function listBudget(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBudget(input, actor = 'system') {
  const row = {
    id: `bud_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"label":"Yeni kalem","planned":"10000","actual":"0","period":"2026-08"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"label":"Yeni kalem","planned":"10000","actual":"0","period":"2026-08"}[k]];
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
  prependItem('budget-lines', row, 300);
  appendAudit({ actor, action: 'budget.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateBudget(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('budget-lines', list);
  appendAudit({ actor, action: 'budget.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function budgetSummary() {
  const list = listBudget();
  return {
    total: list.length,
    
    lines: list,
  };
}
