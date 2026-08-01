/**
 * AŞAMA 638 — Daze Room.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dazeroom', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dzr_1', room: "412",
      offer: "Night amenity", status: 'idle', at: new Date().toISOString() }];
    writeCollection('dazeroom', seed);
    return seed;
  }
  return list;
}
export function listDazeroom(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDazeroom(input, actor = 'system') {
  const row = {
    id: `dzr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    offer: input.offer !== undefined ? input.offer : "Night amenity",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dazeroom', row, 300);
  appendAudit({
    actor,
    action: 'dazeroom.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDazeroom(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dazeroom', list);
  appendAudit({ actor, action: 'dazeroom.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dazeroomSummary() {
  const list = listDazeroom();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    offered: list.filter((x) => x.status === 'offered').length,
    accepted: list.filter((x) => x.status === 'accepted').length,
    delivered: list.filter((x) => x.status === 'delivered').length, dazeroom: list };
}
