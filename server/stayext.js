/**
 * AŞAMA 226 — Konaklama Uzat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('stayext', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'stx_1', room: "204",
      nights: "1", status: 'offered', at: new Date().toISOString() }];
    writeCollection('stayext', seed);
    return seed;
  }
  return list;
}
export function listStayext(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStayext(input, actor = 'system') {
  const row = {
    id: `stx_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "204",
    nights: input.nights !== undefined ? Number(input.nights) || 0 : 1,
    status: input.status || 'offered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('stayext', row, 300);
  appendAudit({ actor, action: 'stayext.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateStayext(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('stayext', list);
  appendAudit({ actor, action: 'stayext.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function stayextSummary() {
  const list = listStayext();
  return { total: list.length, offered: list.filter((x) => x.status === 'offered').length,
    accepted: list.filter((x) => x.status === 'accepted').length,
    declined: list.filter((x) => x.status === 'declined').length, stayext: list };
}
