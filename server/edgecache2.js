/**
 * AŞAMA 339 — Edge Store.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('edgecache2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ecs_1', node: "Cache-A",
      hitPct: "88", status: 'healthy', at: new Date().toISOString() }];
    writeCollection('edgecache2', seed);
    return seed;
  }
  return list;
}
export function listEdgecache2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEdgecache2(input, actor = 'system') {
  const row = {
    id: `ecs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    node: input.node !== undefined ? input.node : "Cache-A",
    hitPct: input.hitPct !== undefined ? Number(input.hitPct) || 0 : 88,
    status: input.status || 'healthy',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('edgecache2', row, 300);
  appendAudit({
    actor,
    action: 'edgecache2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEdgecache2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('edgecache2', list);
  appendAudit({ actor, action: 'edgecache2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function edgecache2Summary() {
  const list = listEdgecache2();
  return { total: list.length, healthy: list.filter((x) => x.status === 'healthy').length,
    purge: list.filter((x) => x.status === 'purge').length,
    cold: list.filter((x) => x.status === 'cold').length, edgecache2: list };
}
