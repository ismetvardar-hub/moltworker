/**
 * AŞAMA 983 — Cache Mesh.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cachemesh2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cac_1', node: "Alpha",
      hit: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('cachemesh2', seed);
    return seed;
  }
  return list;
}
export function listCachemesh2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCachemesh2(input, actor = 'system') {
  const row = {
    id: `cac_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    node: input.node !== undefined ? input.node : "Alpha",
    hit: input.hit !== undefined ? Number(input.hit) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cachemesh2', row, 300);
  appendAudit({
    actor,
    action: 'cachemesh2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCachemesh2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cachemesh2', list);
  appendAudit({ actor, action: 'cachemesh2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cachemesh2Summary() {
  const list = listCachemesh2();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, cachemesh2: list };
}
