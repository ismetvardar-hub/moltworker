/**
 * AŞAMA 227 — Oda Taşıma.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('roommove', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rmv_1', fromRoom: "101",
      toRoom: "305", status: 'requested', at: new Date().toISOString() }];
    writeCollection('roommove', seed);
    return seed;
  }
  return list;
}
export function listRoommove(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRoommove(input, actor = 'system') {
  const row = {
    id: `rmv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    fromRoom: input.fromRoom !== undefined ? input.fromRoom : "101",
    toRoom: input.toRoom !== undefined ? input.toRoom : "305",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('roommove', row, 300);
  appendAudit({ actor, action: 'roommove.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateRoommove(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('roommove', list);
  appendAudit({ actor, action: 'roommove.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function roommoveSummary() {
  const list = listRoommove();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    done: list.filter((x) => x.status === 'done').length, roommove: list };
}
