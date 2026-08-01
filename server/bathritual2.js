/**
 * AŞAMA 966 — Bath Ritual.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bathritual2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bat_1', room: "Alpha",
      ritual: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('bathritual2', seed);
    return seed;
  }
  return list;
}
export function listBathritual2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBathritual2(input, actor = 'system') {
  const row = {
    id: `bat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Alpha",
    ritual: input.ritual !== undefined ? input.ritual : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bathritual2', row, 300);
  appendAudit({
    actor,
    action: 'bathritual2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBathritual2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bathritual2', list);
  appendAudit({ actor, action: 'bathritual2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bathritual2Summary() {
  const list = listBathritual2();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, bathritual2: list };
}
