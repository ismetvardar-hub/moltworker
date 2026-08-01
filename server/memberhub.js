/**
 * AŞAMA 782 — Member Hub.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('memberhub', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mem_1', member: "Alpha",
      tier: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('memberhub', seed);
    return seed;
  }
  return list;
}
export function listMemberhub(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMemberhub(input, actor = 'system') {
  const row = {
    id: `mem_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    member: input.member !== undefined ? input.member : "Alpha",
    tier: input.tier !== undefined ? input.tier : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('memberhub', row, 300);
  appendAudit({
    actor,
    action: 'memberhub.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMemberhub(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('memberhub', list);
  appendAudit({ actor, action: 'memberhub.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function memberhubSummary() {
  const list = listMemberhub();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, memberhub: list };
}
