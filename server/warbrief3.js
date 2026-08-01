/**
 * AŞAMA 1107 — War Brief.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('warbrief3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'war_1', topic: "Alpha",
      owner: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('warbrief3', seed);
    return seed;
  }
  return list;
}
export function listWarbrief3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWarbrief3(input, actor = 'system') {
  const row = {
    id: `war_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('warbrief3', row, 300);
  appendAudit({
    actor,
    action: 'warbrief3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWarbrief3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('warbrief3', list);
  appendAudit({ actor, action: 'warbrief3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function warbrief3Summary() {
  const list = listWarbrief3();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, warbrief3: list };
}
