/**
 * AŞAMA 482 — Plant Room.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('plantroom', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'plr_1', room: "PR-1",
      check: "OK", status: 'ok', at: new Date().toISOString() }];
    writeCollection('plantroom', seed);
    return seed;
  }
  return list;
}
export function listPlantroom(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPlantroom(input, actor = 'system') {
  const row = {
    id: `plr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "PR-1",
    check: input.check !== undefined ? input.check : "OK",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('plantroom', row, 300);
  appendAudit({
    actor,
    action: 'plantroom.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePlantroom(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('plantroom', list);
  appendAudit({ actor, action: 'plantroom.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function plantroomSummary() {
  const list = listPlantroom();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    attention: list.filter((x) => x.status === 'attention').length,
    critical: list.filter((x) => x.status === 'critical').length, plantroom: list };
}
