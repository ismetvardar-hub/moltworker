/**
 * AŞAMA 237 — Ayakkabı Boya.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('shoeshine', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'shn_1', room: "118",
      pairs: "1", status: 'queued', at: new Date().toISOString() }];
    writeCollection('shoeshine', seed);
    return seed;
  }
  return list;
}
export function listShoeshine(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createShoeshine(input, actor = 'system') {
  const row = {
    id: `shn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "118",
    pairs: input.pairs !== undefined ? Number(input.pairs) || 0 : 1,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shoeshine', row, 300);
  appendAudit({ actor, action: 'shoeshine.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateShoeshine(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shoeshine', list);
  appendAudit({ actor, action: 'shoeshine.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function shoeshineSummary() {
  const list = listShoeshine();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    done: list.filter((x) => x.status === 'done').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length, shoeshine: list };
}
