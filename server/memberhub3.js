/**
 * AŞAMA 1142 — Member Hub.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('memberhub3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mem_1', member: "Alpha",
      tier: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('memberhub3', seed);
    return seed;
  }
  return list;
}
export function listMemberhub3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMemberhub3(input, actor = 'system') {
  const row = {
    id: `mem_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    member: input.member !== undefined ? input.member : "Alpha",
    tier: input.tier !== undefined ? input.tier : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('memberhub3', row, 300);
  appendAudit({
    actor,
    action: 'memberhub3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMemberhub3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('memberhub3', list);
  appendAudit({ actor, action: 'memberhub3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function memberhub3Summary() {
  const list = listMemberhub3();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, memberhub3: list };
}
