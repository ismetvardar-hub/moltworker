/**
 * AŞAMA 532 — Lineage.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('lineage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lng_1', from: "pos",
      to: "datalake", status: 'mapped', at: new Date().toISOString() }];
    writeCollection('lineage', seed);
    return seed;
  }
  return list;
}
export function listLineage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLineage(input, actor = 'system') {
  const row = {
    id: `lng_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    from: input.from !== undefined ? input.from : "pos",
    to: input.to !== undefined ? input.to : "datalake",
    status: input.status || 'mapped',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lineage', row, 300);
  appendAudit({
    actor,
    action: 'lineage.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLineage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lineage', list);
  appendAudit({ actor, action: 'lineage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function lineageSummary() {
  const list = listLineage();
  return { total: list.length, mapped: list.filter((x) => x.status === 'mapped').length,
    broken: list.filter((x) => x.status === 'broken').length,
    verified: list.filter((x) => x.status === 'verified').length, lineage: list };
}
