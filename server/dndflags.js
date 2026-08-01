/**
 * AŞAMA 233 — DND / MUR.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dndflags', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dnd_1', room: "220",
      flag: "DND", status: 'dnd', at: new Date().toISOString() }];
    writeCollection('dndflags', seed);
    return seed;
  }
  return list;
}
export function listDndflags(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDndflags(input, actor = 'system') {
  const row = {
    id: `dnd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "220",
    flag: input.flag !== undefined ? input.flag : "DND",
    status: input.status || 'dnd',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dndflags', row, 300);
  appendAudit({ actor, action: 'dndflags.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateDndflags(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dndflags', list);
  appendAudit({ actor, action: 'dndflags.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dndflagsSummary() {
  const list = listDndflags();
  return { total: list.length, dnd: list.filter((x) => x.status === 'dnd').length,
    mur: list.filter((x) => x.status === 'mur').length,
    clear: list.filter((x) => x.status === 'clear').length, dndflags: list };
}
