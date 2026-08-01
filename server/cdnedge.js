/**
 * AŞAMA 774 — CDN Edge.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cdnedge', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cdn_1', edge: "Alpha",
      status: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('cdnedge', seed);
    return seed;
  }
  return list;
}
export function listCdnedge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCdnedge(input, actor = 'system') {
  const row = {
    id: `cdn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    edge: input.edge !== undefined ? input.edge : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cdnedge', row, 300);
  appendAudit({
    actor,
    action: 'cdnedge.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCdnedge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cdnedge', list);
  appendAudit({ actor, action: 'cdnedge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cdnedgeSummary() {
  const list = listCdnedge();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, cdnedge: list };
}
