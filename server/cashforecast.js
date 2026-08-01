/**
 * AŞAMA 387 — Nakit Forecast.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cashforecast', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cff_1', horizon: "7d",
      amount: "280000", status: 'draft', at: new Date().toISOString() }];
    writeCollection('cashforecast', seed);
    return seed;
  }
  return list;
}
export function listCashforecast(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCashforecast(input, actor = 'system') {
  const row = {
    id: `cff_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    horizon: input.horizon !== undefined ? input.horizon : "7d",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 280000,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cashforecast', row, 300);
  appendAudit({
    actor,
    action: 'cashforecast.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCashforecast(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cashforecast', list);
  appendAudit({ actor, action: 'cashforecast.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cashforecastSummary() {
  const list = listCashforecast();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    locked: list.filter((x) => x.status === 'locked').length, cashforecast: list };
}
