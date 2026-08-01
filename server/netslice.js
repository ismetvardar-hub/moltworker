/**
 * AŞAMA 343 — Net Slice.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('netslice', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nsl_1', slice: "Guest-WiFi",
      priority: "2", status: 'active', at: new Date().toISOString() }];
    writeCollection('netslice', seed);
    return seed;
  }
  return list;
}
export function listNetslice(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNetslice(input, actor = 'system') {
  const row = {
    id: `nsl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slice: input.slice !== undefined ? input.slice : "Guest-WiFi",
    priority: input.priority !== undefined ? Number(input.priority) || 0 : 2,
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('netslice', row, 300);
  appendAudit({
    actor,
    action: 'netslice.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNetslice(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('netslice', list);
  appendAudit({ actor, action: 'netslice.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function netsliceSummary() {
  const list = listNetslice();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length, netslice: list };
}
