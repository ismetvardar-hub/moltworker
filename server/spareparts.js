/**
 * AŞAMA 487 — Spare Parts.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('spareparts', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'spr_1', sku: "Belt-40",
      qty: "3", status: 'stocked', at: new Date().toISOString() }];
    writeCollection('spareparts', seed);
    return seed;
  }
  return list;
}
export function listSpareparts(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSpareparts(input, actor = 'system') {
  const row = {
    id: `spr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Belt-40",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 3,
    status: input.status || 'stocked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('spareparts', row, 300);
  appendAudit({
    actor,
    action: 'spareparts.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSpareparts(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('spareparts', list);
  appendAudit({ actor, action: 'spareparts.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sparepartsSummary() {
  const list = listSpareparts();
  return { total: list.length, stocked: list.filter((x) => x.status === 'stocked').length,
    low: list.filter((x) => x.status === 'low').length,
    ordered: list.filter((x) => x.status === 'ordered').length, spareparts: list };
}
