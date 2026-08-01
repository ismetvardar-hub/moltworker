/**
 * AŞAMA 364 — War Room Seat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('warroomseat', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wrs_1', seat: "Ops Lead",
      owner: "CEO", status: 'open', at: new Date().toISOString() }];
    writeCollection('warroomseat', seed);
    return seed;
  }
  return list;
}
export function listWarroomseat(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWarroomseat(input, actor = 'system') {
  const row = {
    id: `wrs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    seat: input.seat !== undefined ? input.seat : "Ops Lead",
    owner: input.owner !== undefined ? input.owner : "CEO",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('warroomseat', row, 300);
  appendAudit({
    actor,
    action: 'warroomseat.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWarroomseat(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('warroomseat', list);
  appendAudit({ actor, action: 'warroomseat.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function warroomseatSummary() {
  const list = listWarroomseat();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    standby: list.filter((x) => x.status === 'standby').length, warroomseat: list };
}
