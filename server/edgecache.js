/**
 * AŞAMA 164 — Edge Cache.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('edgecache', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'edg_1', zone: "tr-1",
      hitRate: "92", status: 'healthy', at: new Date().toISOString() }];
    writeCollection('edgecache', seed);
    return seed;
  }
  return list;
}
export function listEdgecache(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEdgecache(input, actor = 'system') {
  const row = {
    id: `edg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "tr-1",
    hitRate: input.hitRate !== undefined ? Number(input.hitRate) || 0 : 92,
    status: input.status || 'healthy',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('edgecache', row, 300);
  appendAudit({ actor, action: 'edgecache.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateEdgecache(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('edgecache', list);
  appendAudit({ actor, action: 'edgecache.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function edgecacheSummary() {
  const list = listEdgecache();
  return { total: list.length, healthy: list.filter((x) => x.status === 'healthy').length,
    purge: list.filter((x) => x.status === 'purge').length,
    degraded: list.filter((x) => x.status === 'degraded').length, edgecache: list };
}
