/**
 * AŞAMA 603 — Linen Room.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('linenroom', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lnr_1', sku: "King sheet",
      qty: "40", status: 'stocked', at: new Date().toISOString() }];
    writeCollection('linenroom', seed);
    return seed;
  }
  return list;
}
export function listLinenroom(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLinenroom(input, actor = 'system') {
  const row = {
    id: `lnr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "King sheet",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 40,
    status: input.status || 'stocked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('linenroom', row, 300);
  appendAudit({
    actor,
    action: 'linenroom.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLinenroom(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('linenroom', list);
  appendAudit({ actor, action: 'linenroom.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function linenroomSummary() {
  const list = listLinenroom();
  return { total: list.length, stocked: list.filter((x) => x.status === 'stocked').length,
    low: list.filter((x) => x.status === 'low').length,
    ordered: list.filter((x) => x.status === 'ordered').length, linenroom: list };
}
