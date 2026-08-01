/**
 * AŞAMA 231 — Yastık Menü.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pillowmenu', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'plw_1', room: "108",
      pillow: "Ortopedik", status: 'requested', at: new Date().toISOString() }];
    writeCollection('pillowmenu', seed);
    return seed;
  }
  return list;
}
export function listPillowmenu(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPillowmenu(input, actor = 'system') {
  const row = {
    id: `plw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "108",
    pillow: input.pillow !== undefined ? input.pillow : "Ortopedik",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pillowmenu', row, 300);
  appendAudit({ actor, action: 'pillowmenu.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updatePillowmenu(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pillowmenu', list);
  appendAudit({ actor, action: 'pillowmenu.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pillowmenuSummary() {
  const list = listPillowmenu();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    set: list.filter((x) => x.status === 'set').length,
    changed: list.filter((x) => x.status === 'changed').length, pillowmenu: list };
}
