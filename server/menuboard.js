/**
 * AŞAMA 211 — Menü Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('menuboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mnb_1', board: "Beach Bar",
      version: "v3", status: 'draft', at: new Date().toISOString() }];
    writeCollection('menuboard', seed);
    return seed;
  }
  return list;
}
export function listMenuboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMenuboard(input, actor = 'system') {
  const row = {
    id: `mnb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    board: input.board !== undefined ? input.board : "Beach Bar",
    version: input.version !== undefined ? input.version : "v3",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('menuboard', row, 300);
  appendAudit({ actor, action: 'menuboard.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateMenuboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('menuboard', list);
  appendAudit({ actor, action: 'menuboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function menuboardSummary() {
  const list = listMenuboard();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, menuboard: list };
}
