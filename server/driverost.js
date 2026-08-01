/**
 * AŞAMA 588 — Driver Rost.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('driverost', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'drv_1', driver: "Can",
      shift: "Day", status: 'rostered', at: new Date().toISOString() }];
    writeCollection('driverost', seed);
    return seed;
  }
  return list;
}
export function listDriverost(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDriverost(input, actor = 'system') {
  const row = {
    id: `drv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    driver: input.driver !== undefined ? input.driver : "Can",
    shift: input.shift !== undefined ? input.shift : "Day",
    status: input.status || 'rostered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('driverost', row, 300);
  appendAudit({
    actor,
    action: 'driverost.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDriverost(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('driverost', list);
  appendAudit({ actor, action: 'driverost.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function driverostSummary() {
  const list = listDriverost();
  return { total: list.length, rostered: list.filter((x) => x.status === 'rostered').length,
    on_duty: list.filter((x) => x.status === 'on_duty').length,
    off: list.filter((x) => x.status === 'off').length, driverost: list };
}
