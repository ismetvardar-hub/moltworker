/**
 * AŞAMA 650 — Shrink Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('shrinklog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'shr_1', sku: "SNACK-01",
      qty: "2", status: 'logged', at: new Date().toISOString() }];
    writeCollection('shrinklog', seed);
    return seed;
  }
  return list;
}
export function listShrinklog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createShrinklog(input, actor = 'system') {
  const row = {
    id: `shr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "SNACK-01",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 2,
    status: input.status || 'logged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shrinklog', row, 300);
  appendAudit({
    actor,
    action: 'shrinklog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateShrinklog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shrinklog', list);
  appendAudit({ actor, action: 'shrinklog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function shrinklogSummary() {
  const list = listShrinklog();
  return { total: list.length, logged: list.filter((x) => x.status === 'logged').length,
    reviewed: list.filter((x) => x.status === 'reviewed').length,
    written_off: list.filter((x) => x.status === 'written_off').length, shrinklog: list };
}
