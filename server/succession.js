/**
 * AŞAMA 502 — Succession.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('succession', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'suc_1', role: "GM",
      ready: "12m", status: 'pipeline', at: new Date().toISOString() }];
    writeCollection('succession', seed);
    return seed;
  }
  return list;
}
export function listSuccession(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSuccession(input, actor = 'system') {
  const row = {
    id: `suc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    role: input.role !== undefined ? input.role : "GM",
    ready: input.ready !== undefined ? input.ready : "12m",
    status: input.status || 'pipeline',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('succession', row, 300);
  appendAudit({
    actor,
    action: 'succession.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSuccession(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('succession', list);
  appendAudit({ actor, action: 'succession.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function successionSummary() {
  const list = listSuccession();
  return { total: list.length, pipeline: list.filter((x) => x.status === 'pipeline').length,
    ready: list.filter((x) => x.status === 'ready').length,
    appointed: list.filter((x) => x.status === 'appointed').length, succession: list };
}
