/**
 * AŞAMA 1092 — Inventory Age.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('inventoryage3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inv_1', sku: "Alpha",
      days: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('inventoryage3', seed);
    return seed;
  }
  return list;
}
export function listInventoryage3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInventoryage3(input, actor = 'system') {
  const row = {
    id: `inv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Alpha",
    days: input.days !== undefined ? Number(input.days) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('inventoryage3', row, 300);
  appendAudit({
    actor,
    action: 'inventoryage3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateInventoryage3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('inventoryage3', list);
  appendAudit({ actor, action: 'inventoryage3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function inventoryage3Summary() {
  const list = listInventoryage3();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, inventoryage3: list };
}
