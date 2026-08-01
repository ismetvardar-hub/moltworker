/**
 * AŞAMA 894 — Constellate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('constellate', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'con_1', node: "Alpha",
      links: "5", status: 'idle', at: new Date().toISOString() }];
    writeCollection('constellate', seed);
    return seed;
  }
  return list;
}
export function listConstellate(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createConstellate(input, actor = 'system') {
  const row = {
    id: `con_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    node: input.node !== undefined ? input.node : "Alpha",
    links: input.links !== undefined ? Number(input.links) || 0 : 5,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('constellate', row, 300);
  appendAudit({
    actor,
    action: 'constellate.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateConstellate(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('constellate', list);
  appendAudit({ actor, action: 'constellate.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function constellateSummary() {
  const list = listConstellate();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, constellate: list };
}
