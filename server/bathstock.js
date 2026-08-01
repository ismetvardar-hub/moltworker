/**
 * AŞAMA 234 — Bornoz Stok.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bathstock', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bth_1', room: "115",
      item: "Bornoz", status: 'issued', at: new Date().toISOString() }];
    writeCollection('bathstock', seed);
    return seed;
  }
  return list;
}
export function listBathstock(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBathstock(input, actor = 'system') {
  const row = {
    id: `bth_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "115",
    item: input.item !== undefined ? input.item : "Bornoz",
    status: input.status || 'issued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bathstock', row, 300);
  appendAudit({ actor, action: 'bathstock.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateBathstock(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bathstock', list);
  appendAudit({ actor, action: 'bathstock.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bathstockSummary() {
  const list = listBathstock();
  return { total: list.length, issued: list.filter((x) => x.status === 'issued').length,
    returned: list.filter((x) => x.status === 'returned').length,
    missing: list.filter((x) => x.status === 'missing').length, bathstock: list };
}
