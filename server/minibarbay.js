/**
 * AŞAMA 604 — Minibar Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('minibarbay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mbb_1', room: "412",
      sku: "Water", status: 'due', at: new Date().toISOString() }];
    writeCollection('minibarbay', seed);
    return seed;
  }
  return list;
}
export function listMinibarbay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMinibarbay(input, actor = 'system') {
  const row = {
    id: `mbb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    sku: input.sku !== undefined ? input.sku : "Water",
    status: input.status || 'due',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('minibarbay', row, 300);
  appendAudit({
    actor,
    action: 'minibarbay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMinibarbay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('minibarbay', list);
  appendAudit({ actor, action: 'minibarbay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function minibarbaySummary() {
  const list = listMinibarbay();
  return { total: list.length, due: list.filter((x) => x.status === 'due').length,
    restocked: list.filter((x) => x.status === 'restocked').length,
    billed: list.filter((x) => x.status === 'billed').length, minibarbay: list };
}
