/**
 * AŞAMA 601 — Room Rack.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('roomrack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rrk_1', room: "412",
      rack: "VD", status: 'VD', at: new Date().toISOString() }];
    writeCollection('roomrack', seed);
    return seed;
  }
  return list;
}
export function listRoomrack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRoomrack(input, actor = 'system') {
  const row = {
    id: `rrk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    rack: input.rack !== undefined ? input.rack : "VD",
    status: input.status || 'VD',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('roomrack', row, 300);
  appendAudit({
    actor,
    action: 'roomrack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRoomrack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('roomrack', list);
  appendAudit({ actor, action: 'roomrack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function roomrackSummary() {
  const list = listRoomrack();
  return { total: list.length, VD: list.filter((x) => x.status === 'VD').length,
    VC: list.filter((x) => x.status === 'VC').length,
    OCC: list.filter((x) => x.status === 'OCC').length,
    OOO: list.filter((x) => x.status === 'OOO').length, roomrack: list };
}
