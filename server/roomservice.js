/**
 * AŞAMA 459 — Room Service.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('roomservice', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rms_1', room: "412",
      order: "Breakfast", status: 'received', at: new Date().toISOString() }];
    writeCollection('roomservice', seed);
    return seed;
  }
  return list;
}
export function listRoomservice(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRoomservice(input, actor = 'system') {
  const row = {
    id: `rms_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    order: input.order !== undefined ? input.order : "Breakfast",
    status: input.status || 'received',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('roomservice', row, 300);
  appendAudit({
    actor,
    action: 'roomservice.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRoomservice(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('roomservice', list);
  appendAudit({ actor, action: 'roomservice.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function roomserviceSummary() {
  const list = listRoomservice();
  return { total: list.length, received: list.filter((x) => x.status === 'received').length,
    prep: list.filter((x) => x.status === 'prep').length,
    delivered: list.filter((x) => x.status === 'delivered').length, roomservice: list };
}
