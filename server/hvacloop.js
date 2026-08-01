/**
 * AŞAMA 483 — HVAC Loop.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hvacloop', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hvl_1', loop: "East wing",
      setpoint: "23", status: 'auto', at: new Date().toISOString() }];
    writeCollection('hvacloop', seed);
    return seed;
  }
  return list;
}
export function listHvacloop(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHvacloop(input, actor = 'system') {
  const row = {
    id: `hvl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    loop: input.loop !== undefined ? input.loop : "East wing",
    setpoint: input.setpoint !== undefined ? Number(input.setpoint) || 0 : 23,
    status: input.status || 'auto',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hvacloop', row, 300);
  appendAudit({
    actor,
    action: 'hvacloop.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHvacloop(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hvacloop', list);
  appendAudit({ actor, action: 'hvacloop.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hvacloopSummary() {
  const list = listHvacloop();
  return { total: list.length, auto: list.filter((x) => x.status === 'auto').length,
    manual: list.filter((x) => x.status === 'manual').length,
    fault: list.filter((x) => x.status === 'fault').length, hvacloop: list };
}
