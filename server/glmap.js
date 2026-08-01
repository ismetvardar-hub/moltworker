/**
 * AŞAMA 583 — GL Map.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('glmap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'glm_1', account: "4001",
      label: "Room revenue", status: 'mapped', at: new Date().toISOString() }];
    writeCollection('glmap', seed);
    return seed;
  }
  return list;
}
export function listGlmap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGlmap(input, actor = 'system') {
  const row = {
    id: `glm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    account: input.account !== undefined ? input.account : "4001",
    label: input.label !== undefined ? input.label : "Room revenue",
    status: input.status || 'mapped',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('glmap', row, 300);
  appendAudit({
    actor,
    action: 'glmap.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGlmap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('glmap', list);
  appendAudit({ actor, action: 'glmap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function glmapSummary() {
  const list = listGlmap();
  return { total: list.length, mapped: list.filter((x) => x.status === 'mapped').length,
    review: list.filter((x) => x.status === 'review').length,
    error: list.filter((x) => x.status === 'error').length, glmap: list };
}
