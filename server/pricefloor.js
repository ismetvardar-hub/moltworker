/**
 * AŞAMA 380 — Fiyat Tabanı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pricefloor', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pfl_1', product: "Day Pass",
      floor: "1200", status: 'active', at: new Date().toISOString() }];
    writeCollection('pricefloor', seed);
    return seed;
  }
  return list;
}
export function listPricefloor(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPricefloor(input, actor = 'system') {
  const row = {
    id: `pfl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    product: input.product !== undefined ? input.product : "Day Pass",
    floor: input.floor !== undefined ? Number(input.floor) || 0 : 1200,
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pricefloor', row, 300);
  appendAudit({
    actor,
    action: 'pricefloor.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePricefloor(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pricefloor', list);
  appendAudit({ actor, action: 'pricefloor.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pricefloorSummary() {
  const list = listPricefloor();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    breached: list.filter((x) => x.status === 'breached').length, pricefloor: list };
}
