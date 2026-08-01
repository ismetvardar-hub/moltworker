/**
 * AŞAMA 733 — Replen Plan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('replenplan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rep_1', sku: "Alpha",
      qty: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('replenplan', seed);
    return seed;
  }
  return list;
}
export function listReplenplan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createReplenplan(input, actor = 'system') {
  const row = {
    id: `rep_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Alpha",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('replenplan', row, 300);
  appendAudit({
    actor,
    action: 'replenplan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateReplenplan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('replenplan', list);
  appendAudit({ actor, action: 'replenplan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function replenplanSummary() {
  const list = listReplenplan();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, replenplan: list };
}
