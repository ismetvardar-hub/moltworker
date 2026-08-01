/**
 * AŞAMA 984 — CDN Edge.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cdnedge2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cdn_1', edge: "Alpha",
      status: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('cdnedge2', seed);
    return seed;
  }
  return list;
}
export function listCdnedge2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCdnedge2(input, actor = 'system') {
  const row = {
    id: `cdn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    edge: input.edge !== undefined ? input.edge : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cdnedge2', row, 300);
  appendAudit({
    actor,
    action: 'cdnedge2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCdnedge2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cdnedge2', list);
  appendAudit({ actor, action: 'cdnedge2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cdnedge2Summary() {
  const list = listCdnedge2();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, cdnedge2: list };
}
