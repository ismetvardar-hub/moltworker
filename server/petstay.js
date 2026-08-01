/**
 * AŞAMA 239 — Pet Stay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('petstay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pet_1', guestName: "Misafir",
      pet: "Köpek", status: 'registered', at: new Date().toISOString() }];
    writeCollection('petstay', seed);
    return seed;
  }
  return list;
}
export function listPetstay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPetstay(input, actor = 'system') {
  const row = {
    id: `pet_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    pet: input.pet !== undefined ? input.pet : "Köpek",
    status: input.status || 'registered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('petstay', row, 300);
  appendAudit({ actor, action: 'petstay.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updatePetstay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('petstay', list);
  appendAudit({ actor, action: 'petstay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function petstaySummary() {
  const list = listPetstay();
  return { total: list.length, registered: list.filter((x) => x.status === 'registered').length,
    inhouse: list.filter((x) => x.status === 'inhouse').length,
    checked_out: list.filter((x) => x.status === 'checked_out').length, petstay: list };
}
