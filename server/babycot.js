/**
 * AŞAMA 238 — Bebek Karyola.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('babycot', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cot_1', room: "509",
      item: "Beşik", status: 'requested', at: new Date().toISOString() }];
    writeCollection('babycot', seed);
    return seed;
  }
  return list;
}
export function listBabycot(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBabycot(input, actor = 'system') {
  const row = {
    id: `cot_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "509",
    item: input.item !== undefined ? input.item : "Beşik",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('babycot', row, 300);
  appendAudit({ actor, action: 'babycot.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateBabycot(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('babycot', list);
  appendAudit({ actor, action: 'babycot.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function babycotSummary() {
  const list = listBabycot();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    set: list.filter((x) => x.status === 'set').length,
    removed: list.filter((x) => x.status === 'removed').length, babycot: list };
}
