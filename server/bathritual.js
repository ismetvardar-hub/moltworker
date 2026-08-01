/**
 * AŞAMA 756 — Bath Ritual.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bathritual', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bat_1', room: "Alpha",
      ritual: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('bathritual', seed);
    return seed;
  }
  return list;
}
export function listBathritual(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBathritual(input, actor = 'system') {
  const row = {
    id: `bat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Alpha",
    ritual: input.ritual !== undefined ? input.ritual : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bathritual', row, 300);
  appendAudit({
    actor,
    action: 'bathritual.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBathritual(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bathritual', list);
  appendAudit({ actor, action: 'bathritual.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bathritualSummary() {
  const list = listBathritual();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, bathritual: list };
}
