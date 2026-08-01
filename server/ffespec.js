/**
 * AŞAMA 851 — FFE Spec.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ffespec', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ffe_1', item: "Alpha",
      qty: "5", status: 'idle', at: new Date().toISOString() }];
    writeCollection('ffespec', seed);
    return seed;
  }
  return list;
}
export function listFfespec(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFfespec(input, actor = 'system') {
  const row = {
    id: `ffe_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Alpha",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 5,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ffespec', row, 300);
  appendAudit({
    actor,
    action: 'ffespec.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFfespec(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ffespec', list);
  appendAudit({ actor, action: 'ffespec.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ffespecSummary() {
  const list = listFfespec();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, ffespec: list };
}
