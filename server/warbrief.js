/**
 * AŞAMA 747 — War Brief.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('warbrief', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'war_1', topic: "Alpha",
      owner: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('warbrief', seed);
    return seed;
  }
  return list;
}
export function listWarbrief(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWarbrief(input, actor = 'system') {
  const row = {
    id: `war_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('warbrief', row, 300);
  appendAudit({
    actor,
    action: 'warbrief.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWarbrief(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('warbrief', list);
  appendAudit({ actor, action: 'warbrief.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function warbriefSummary() {
  const list = listWarbrief();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, warbrief: list };
}
