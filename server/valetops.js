/**
 * AŞAMA 594 — Valet Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('valetops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vlt_1', ticket: "V-88",
      plate: "34 AB 12", status: 'parked', at: new Date().toISOString() }];
    writeCollection('valetops', seed);
    return seed;
  }
  return list;
}
export function listValetops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createValetops(input, actor = 'system') {
  const row = {
    id: `vlt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ticket: input.ticket !== undefined ? input.ticket : "V-88",
    plate: input.plate !== undefined ? input.plate : "34 AB 12",
    status: input.status || 'parked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('valetops', row, 300);
  appendAudit({
    actor,
    action: 'valetops.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateValetops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('valetops', list);
  appendAudit({ actor, action: 'valetops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function valetopsSummary() {
  const list = listValetops();
  return { total: list.length, parked: list.filter((x) => x.status === 'parked').length,
    requested: list.filter((x) => x.status === 'requested').length,
    delivered: list.filter((x) => x.status === 'delivered').length, valetops: list };
}
