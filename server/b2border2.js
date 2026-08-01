/**
 * AŞAMA 924 — B2B Order.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('b2border2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'b2b_1', buyer: "Alpha",
      sku: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('b2border2', seed);
    return seed;
  }
  return list;
}
export function listB2border2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createB2border2(input, actor = 'system') {
  const row = {
    id: `b2b_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    buyer: input.buyer !== undefined ? input.buyer : "Alpha",
    sku: input.sku !== undefined ? input.sku : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('b2border2', row, 300);
  appendAudit({
    actor,
    action: 'b2border2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateB2border2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('b2border2', list);
  appendAudit({ actor, action: 'b2border2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function b2border2Summary() {
  const list = listB2border2();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, b2border2: list };
}
