/**
 * AŞAMA 423 — Vinç Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('craneops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'crn_1', crane: "C-1",
      load: "Pallet", status: 'idle', at: new Date().toISOString() }];
    writeCollection('craneops', seed);
    return seed;
  }
  return list;
}
export function listCraneops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCraneops(input, actor = 'system') {
  const row = {
    id: `crn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    crane: input.crane !== undefined ? input.crane : "C-1",
    load: input.load !== undefined ? input.load : "Pallet",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('craneops', row, 300);
  appendAudit({
    actor,
    action: 'craneops.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCraneops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('craneops', list);
  appendAudit({ actor, action: 'craneops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function craneopsSummary() {
  const list = listCraneops();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    lifting: list.filter((x) => x.status === 'lifting').length,
    service: list.filter((x) => x.status === 'service').length, craneops: list };
}
