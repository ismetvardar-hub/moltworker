/**
 * AŞAMA 654 — Category Buy.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('categorybuy', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ctb_1', category: "F&B retail",
      budget: "120000", status: 'proposed', at: new Date().toISOString() }];
    writeCollection('categorybuy', seed);
    return seed;
  }
  return list;
}
export function listCategorybuy(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCategorybuy(input, actor = 'system') {
  const row = {
    id: `ctb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    category: input.category !== undefined ? input.category : "F&B retail",
    budget: input.budget !== undefined ? Number(input.budget) || 0 : 120000,
    status: input.status || 'proposed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('categorybuy', row, 300);
  appendAudit({
    actor,
    action: 'categorybuy.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCategorybuy(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('categorybuy', list);
  appendAudit({ actor, action: 'categorybuy.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function categorybuySummary() {
  const list = listCategorybuy();
  return { total: list.length, proposed: list.filter((x) => x.status === 'proposed').length,
    approved: list.filter((x) => x.status === 'approved').length,
    ordered: list.filter((x) => x.status === 'ordered').length, categorybuy: list };
}
