/**
 * AŞAMA 488 — Work Order.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('workorder', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wko_1', asset: "Chiller-2",
      task: "Filter", status: 'open', at: new Date().toISOString() }];
    writeCollection('workorder', seed);
    return seed;
  }
  return list;
}
export function listWorkorder(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWorkorder(input, actor = 'system') {
  const row = {
    id: `wko_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Chiller-2",
    task: input.task !== undefined ? input.task : "Filter",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('workorder', row, 300);
  appendAudit({
    actor,
    action: 'workorder.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWorkorder(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('workorder', list);
  appendAudit({ actor, action: 'workorder.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function workorderSummary() {
  const list = listWorkorder();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    assigned: list.filter((x) => x.status === 'assigned').length,
    closed: list.filter((x) => x.status === 'closed').length, workorder: list };
}
