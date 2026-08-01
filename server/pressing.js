/**
 * AŞAMA 236 — Pressing.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pressing', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prs_1', guestName: "Misafir",
      pieces: "3", status: 'received', at: new Date().toISOString() }];
    writeCollection('pressing', seed);
    return seed;
  }
  return list;
}
export function listPressing(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPressing(input, actor = 'system') {
  const row = {
    id: `prs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    pieces: input.pieces !== undefined ? Number(input.pieces) || 0 : 3,
    status: input.status || 'received',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pressing', row, 300);
  appendAudit({ actor, action: 'pressing.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updatePressing(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pressing', list);
  appendAudit({ actor, action: 'pressing.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pressingSummary() {
  const list = listPressing();
  return { total: list.length, received: list.filter((x) => x.status === 'received').length,
    ready: list.filter((x) => x.status === 'ready').length,
    delivered: list.filter((x) => x.status === 'delivered').length, pressing: list };
}
