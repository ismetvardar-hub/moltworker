/**
 * AŞAMA 229 — Bagaj.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('luggage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lug_1', guestName: "Misafir",
      pieces: "2", status: 'held', at: new Date().toISOString() }];
    writeCollection('luggage', seed);
    return seed;
  }
  return list;
}
export function listLuggage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLuggage(input, actor = 'system') {
  const row = {
    id: `lug_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    pieces: input.pieces !== undefined ? Number(input.pieces) || 0 : 2,
    status: input.status || 'held',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('luggage', row, 300);
  appendAudit({ actor, action: 'luggage.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateLuggage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('luggage', list);
  appendAudit({ actor, action: 'luggage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function luggageSummary() {
  const list = listLuggage();
  return { total: list.length, held: list.filter((x) => x.status === 'held').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    claimed: list.filter((x) => x.status === 'claimed').length, luggage: list };
}
