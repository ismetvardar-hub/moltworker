/**
 * AŞAMA 232 — Oda Kokusu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('scenting', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sct_1', room: "301",
      scent: "Lavanta", status: 'set', at: new Date().toISOString() }];
    writeCollection('scenting', seed);
    return seed;
  }
  return list;
}
export function listScenting(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createScenting(input, actor = 'system') {
  const row = {
    id: `sct_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "301",
    scent: input.scent !== undefined ? input.scent : "Lavanta",
    status: input.status || 'set',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('scenting', row, 300);
  appendAudit({ actor, action: 'scenting.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateScenting(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('scenting', list);
  appendAudit({ actor, action: 'scenting.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function scentingSummary() {
  const list = listScenting();
  return { total: list.length, set: list.filter((x) => x.status === 'set').length,
    refill: list.filter((x) => x.status === 'refill').length,
    off: list.filter((x) => x.status === 'off').length, scenting: list };
}
