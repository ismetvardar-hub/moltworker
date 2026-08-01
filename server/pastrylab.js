/**
 * AŞAMA 455 — Pastry Lab.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pastrylab', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'psy_1', batch: "Millefeuille",
      qty: "24", status: 'mixing', at: new Date().toISOString() }];
    writeCollection('pastrylab', seed);
    return seed;
  }
  return list;
}
export function listPastrylab(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPastrylab(input, actor = 'system') {
  const row = {
    id: `psy_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    batch: input.batch !== undefined ? input.batch : "Millefeuille",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 24,
    status: input.status || 'mixing',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pastrylab', row, 300);
  appendAudit({
    actor,
    action: 'pastrylab.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePastrylab(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pastrylab', list);
  appendAudit({ actor, action: 'pastrylab.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pastrylabSummary() {
  const list = listPastrylab();
  return { total: list.length, mixing: list.filter((x) => x.status === 'mixing').length,
    bake: list.filter((x) => x.status === 'bake').length,
    finish: list.filter((x) => x.status === 'finish').length, pastrylab: list };
}
