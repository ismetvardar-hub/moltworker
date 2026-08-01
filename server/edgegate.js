/**
 * AŞAMA 331 — Edge Gate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('edgegate', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'egt_1', node: "EG-01",
      zone: "Beach", status: 'online', at: new Date().toISOString() }];
    writeCollection('edgegate', seed);
    return seed;
  }
  return list;
}
export function listEdgegate(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEdgegate(input, actor = 'system') {
  const row = {
    id: `egt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    node: input.node !== undefined ? input.node : "EG-01",
    zone: input.zone !== undefined ? input.zone : "Beach",
    status: input.status || 'online',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('edgegate', row, 300);
  appendAudit({
    actor,
    action: 'edgegate.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEdgegate(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('edgegate', list);
  appendAudit({ actor, action: 'edgegate.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function edgegateSummary() {
  const list = listEdgegate();
  return { total: list.length, online: list.filter((x) => x.status === 'online').length,
    degraded: list.filter((x) => x.status === 'degraded').length,
    offline: list.filter((x) => x.status === 'offline').length, edgegate: list };
}
