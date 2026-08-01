/**
 * AŞAMA 611 — Out of Order.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('outoforder', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ooo_1', room: "118",
      reason: "AC", status: 'ooo', at: new Date().toISOString() }];
    writeCollection('outoforder', seed);
    return seed;
  }
  return list;
}
export function listOutoforder(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOutoforder(input, actor = 'system') {
  const row = {
    id: `ooo_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "118",
    reason: input.reason !== undefined ? input.reason : "AC",
    status: input.status || 'ooo',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('outoforder', row, 300);
  appendAudit({
    actor,
    action: 'outoforder.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOutoforder(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('outoforder', list);
  appendAudit({ actor, action: 'outoforder.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function outoforderSummary() {
  const list = listOutoforder();
  return { total: list.length, ooo: list.filter((x) => x.status === 'ooo').length,
    oos: list.filter((x) => x.status === 'oos').length,
    released: list.filter((x) => x.status === 'released').length, outoforder: list };
}
