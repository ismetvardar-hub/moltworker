/**
 * AŞAMA 328 — Kurye Havuzu.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('courierpool', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cpl_1', courier: "K-07",
      capacity: "4", status: 'available', at: new Date().toISOString() }];
    writeCollection('courierpool', seed);
    return seed;
  }
  return list;
}
export function listCourierpool(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCourierpool(input, actor = 'system') {
  const row = {
    id: `cpl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    courier: input.courier !== undefined ? input.courier : "K-07",
    capacity: input.capacity !== undefined ? Number(input.capacity) || 0 : 4,
    status: input.status || 'available',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('courierpool', row, 300);
  appendAudit({
    actor,
    action: 'courierpool.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCourierpool(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('courierpool', list);
  appendAudit({ actor, action: 'courierpool.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function courierpoolSummary() {
  const list = listCourierpool();
  return { total: list.length, available: list.filter((x) => x.status === 'available').length,
    busy: list.filter((x) => x.status === 'busy').length,
    offline: list.filter((x) => x.status === 'offline').length, courierpool: list };
}
