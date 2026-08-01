/**
 * AŞAMA 589 — Fuel Card.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('fuelcard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'flc_1', card: "FC-12",
      liters: "40", status: 'ok', at: new Date().toISOString() }];
    writeCollection('fuelcard', seed);
    return seed;
  }
  return list;
}
export function listFuelcard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFuelcard(input, actor = 'system') {
  const row = {
    id: `flc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    card: input.card !== undefined ? input.card : "FC-12",
    liters: input.liters !== undefined ? Number(input.liters) || 0 : 40,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('fuelcard', row, 300);
  appendAudit({
    actor,
    action: 'fuelcard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFuelcard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('fuelcard', list);
  appendAudit({ actor, action: 'fuelcard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function fuelcardSummary() {
  const list = listFuelcard();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    limit: list.filter((x) => x.status === 'limit').length,
    blocked: list.filter((x) => x.status === 'blocked').length, fuelcard: list };
}
