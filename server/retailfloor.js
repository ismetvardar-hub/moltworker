/**
 * AŞAMA 646 — Retail Floor.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('retailfloor', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rtl_1', zone: "Daze Hub",
      traffic: "Medium", status: 'open', at: new Date().toISOString() }];
    writeCollection('retailfloor', seed);
    return seed;
  }
  return list;
}
export function listRetailfloor(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRetailfloor(input, actor = 'system') {
  const row = {
    id: `rtl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Daze Hub",
    traffic: input.traffic !== undefined ? input.traffic : "Medium",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('retailfloor', row, 300);
  appendAudit({
    actor,
    action: 'retailfloor.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRetailfloor(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('retailfloor', list);
  appendAudit({ actor, action: 'retailfloor.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function retailfloorSummary() {
  const list = listRetailfloor();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    busy: list.filter((x) => x.status === 'busy').length,
    closed: list.filter((x) => x.status === 'closed').length, retailfloor: list };
}
