/**
 * AŞAMA 486 — Elevator Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('elevatorlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'elv_1', car: "A1",
      issue: "Door sensor", status: 'ok', at: new Date().toISOString() }];
    writeCollection('elevatorlog', seed);
    return seed;
  }
  return list;
}
export function listElevatorlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createElevatorlog(input, actor = 'system') {
  const row = {
    id: `elv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    car: input.car !== undefined ? input.car : "A1",
    issue: input.issue !== undefined ? input.issue : "Door sensor",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('elevatorlog', row, 300);
  appendAudit({
    actor,
    action: 'elevatorlog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateElevatorlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('elevatorlog', list);
  appendAudit({ actor, action: 'elevatorlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function elevatorlogSummary() {
  const list = listElevatorlog();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    service: list.filter((x) => x.status === 'service').length,
    down: list.filter((x) => x.status === 'down').length, elevatorlog: list };
}
