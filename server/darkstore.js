/**
 * AŞAMA 658 — Dark Store.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('darkstore', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dks_1', hub: "Hub-Antalya",
      orders: "18", status: 'idle', at: new Date().toISOString() }];
    writeCollection('darkstore', seed);
    return seed;
  }
  return list;
}
export function listDarkstore(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDarkstore(input, actor = 'system') {
  const row = {
    id: `dks_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    hub: input.hub !== undefined ? input.hub : "Hub-Antalya",
    orders: input.orders !== undefined ? Number(input.orders) || 0 : 18,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('darkstore', row, 300);
  appendAudit({
    actor,
    action: 'darkstore.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDarkstore(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('darkstore', list);
  appendAudit({ actor, action: 'darkstore.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function darkstoreSummary() {
  const list = listDarkstore();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    picking: list.filter((x) => x.status === 'picking').length,
    dispatch: list.filter((x) => x.status === 'dispatch').length, darkstore: list };
}
