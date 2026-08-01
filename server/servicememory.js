/**
 * AŞAMA 355 — Servis Hafızası.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('servicememory', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'svm_1', guestName: "Misafir",
      note: "Buzsuz içecek", status: 'active', at: new Date().toISOString() }];
    writeCollection('servicememory', seed);
    return seed;
  }
  return list;
}
export function listServicememory(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createServicememory(input, actor = 'system') {
  const row = {
    id: `svm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    note: input.note !== undefined ? input.note : "Buzsuz içecek",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('servicememory', row, 300);
  appendAudit({
    actor,
    action: 'servicememory.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateServicememory(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('servicememory', list);
  appendAudit({ actor, action: 'servicememory.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function servicememorySummary() {
  const list = listServicememory();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    expired: list.filter((x) => x.status === 'expired').length, servicememory: list };
}
