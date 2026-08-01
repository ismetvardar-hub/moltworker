/**
 * AŞAMA 318 — Kurye Takip.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('couriertrack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ctr_1', courier: "K-12",
      zone: "Kaleiçi", status: 'idle', at: new Date().toISOString() }];
    writeCollection('couriertrack', seed);
    return seed;
  }
  return list;
}
export function listCouriertrack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCouriertrack(input, actor = 'system') {
  const row = {
    id: `ctr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    courier: input.courier !== undefined ? input.courier : "K-12",
    zone: input.zone !== undefined ? input.zone : "Kaleiçi",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('couriertrack', row, 300);
  appendAudit({
    actor,
    action: 'couriertrack.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCouriertrack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('couriertrack', list);
  appendAudit({ actor, action: 'couriertrack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function couriertrackSummary() {
  const list = listCouriertrack();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    enroute: list.filter((x) => x.status === 'enroute').length,
    delivered: list.filter((x) => x.status === 'delivered').length, couriertrack: list };
}
