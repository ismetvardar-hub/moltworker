/**
 * AŞAMA 622 — Bag Store.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bagstore', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bgs_1', tag: "B-19",
      guestName: "Misafir", status: 'stored', at: new Date().toISOString() }];
    writeCollection('bagstore', seed);
    return seed;
  }
  return list;
}
export function listBagstore(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBagstore(input, actor = 'system') {
  const row = {
    id: `bgs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    tag: input.tag !== undefined ? input.tag : "B-19",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'stored',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bagstore', row, 300);
  appendAudit({
    actor,
    action: 'bagstore.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBagstore(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bagstore', list);
  appendAudit({ actor, action: 'bagstore.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bagstoreSummary() {
  const list = listBagstore();
  return { total: list.length, stored: list.filter((x) => x.status === 'stored').length,
    released: list.filter((x) => x.status === 'released').length,
    lost: list.filter((x) => x.status === 'lost').length, bagstore: list };
}
