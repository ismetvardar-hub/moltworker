/**
 * AŞAMA 613 — Amen Save.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('amensave', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'amn_1', sku: "Shampoo",
      qty: "120", status: 'stocked', at: new Date().toISOString() }];
    writeCollection('amensave', seed);
    return seed;
  }
  return list;
}
export function listAmensave(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAmensave(input, actor = 'system') {
  const row = {
    id: `amn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Shampoo",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 120,
    status: input.status || 'stocked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('amensave', row, 300);
  appendAudit({
    actor,
    action: 'amensave.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAmensave(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('amensave', list);
  appendAudit({ actor, action: 'amensave.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function amensaveSummary() {
  const list = listAmensave();
  return { total: list.length, stocked: list.filter((x) => x.status === 'stocked').length,
    low: list.filter((x) => x.status === 'low').length,
    waste: list.filter((x) => x.status === 'waste').length, amensave: list };
}
