/**
 * AŞAMA 635 — Rent Gear.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('rentgear', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rng_1', gear: "Snorkel set",
      guestName: "Misafir", status: 'booked', at: new Date().toISOString() }];
    writeCollection('rentgear', seed);
    return seed;
  }
  return list;
}
export function listRentgear(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRentgear(input, actor = 'system') {
  const row = {
    id: `rng_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gear: input.gear !== undefined ? input.gear : "Snorkel set",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('rentgear', row, 300);
  appendAudit({
    actor,
    action: 'rentgear.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRentgear(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('rentgear', list);
  appendAudit({ actor, action: 'rentgear.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function rentgearSummary() {
  const list = listRentgear();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    out: list.filter((x) => x.status === 'out').length,
    returned: list.filter((x) => x.status === 'returned').length,
    late: list.filter((x) => x.status === 'late').length, rentgear: list };
}
