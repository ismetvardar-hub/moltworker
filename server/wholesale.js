/**
 * AŞAMA 715 — Wholesale.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wholesale', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'who_1', sku: "Alpha",
      price: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('wholesale', seed);
    return seed;
  }
  return list;
}
export function listWholesale(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWholesale(input, actor = 'system') {
  const row = {
    id: `who_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Alpha",
    price: input.price !== undefined ? Number(input.price) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wholesale', row, 300);
  appendAudit({
    actor,
    action: 'wholesale.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWholesale(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wholesale', list);
  appendAudit({ actor, action: 'wholesale.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wholesaleSummary() {
  const list = listWholesale();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, wholesale: list };
}
