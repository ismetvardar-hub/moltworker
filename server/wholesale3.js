/**
 * AŞAMA 1075 — Wholesale.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wholesale3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'who_1', sku: "Alpha",
      price: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('wholesale3', seed);
    return seed;
  }
  return list;
}
export function listWholesale3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWholesale3(input, actor = 'system') {
  const row = {
    id: `who_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Alpha",
    price: input.price !== undefined ? Number(input.price) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wholesale3', row, 300);
  appendAudit({
    actor,
    action: 'wholesale3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWholesale3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wholesale3', list);
  appendAudit({ actor, action: 'wholesale3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wholesale3Summary() {
  const list = listWholesale3();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, wholesale3: list };
}
