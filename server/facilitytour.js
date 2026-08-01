/**
 * AŞAMA 491 — Facility Tour.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('facilitytour', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ftr_1', route: "Public areas",
      score: "92", status: 'planned', at: new Date().toISOString() }];
    writeCollection('facilitytour', seed);
    return seed;
  }
  return list;
}
export function listFacilitytour(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFacilitytour(input, actor = 'system') {
  const row = {
    id: `ftr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    route: input.route !== undefined ? input.route : "Public areas",
    score: input.score !== undefined ? Number(input.score) || 0 : 92,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('facilitytour', row, 300);
  appendAudit({
    actor,
    action: 'facilitytour.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFacilitytour(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('facilitytour', list);
  appendAudit({ actor, action: 'facilitytour.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function facilitytourSummary() {
  const list = listFacilitytour();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    walking: list.filter((x) => x.status === 'walking').length,
    scored: list.filter((x) => x.status === 'scored').length, facilitytour: list };
}
