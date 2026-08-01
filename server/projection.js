/**
 * AŞAMA 442 — Projection.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('projection', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prj_1', surface: "Rock wall",
      content: "Constellation", status: 'loaded', at: new Date().toISOString() }];
    writeCollection('projection', seed);
    return seed;
  }
  return list;
}
export function listProjection(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createProjection(input, actor = 'system') {
  const row = {
    id: `prj_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    surface: input.surface !== undefined ? input.surface : "Rock wall",
    content: input.content !== undefined ? input.content : "Constellation",
    status: input.status || 'loaded',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('projection', row, 300);
  appendAudit({
    actor,
    action: 'projection.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateProjection(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('projection', list);
  appendAudit({ actor, action: 'projection.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function projectionSummary() {
  const list = listProjection();
  return { total: list.length, loaded: list.filter((x) => x.status === 'loaded').length,
    projecting: list.filter((x) => x.status === 'projecting').length,
    idle: list.filter((x) => x.status === 'idle').length, projection: list };
}
