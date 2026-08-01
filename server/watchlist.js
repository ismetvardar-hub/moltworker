/**
 * AŞAMA 209 — İzleme Listesi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('watchlist', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wtl_1', name: "Alert Person",
      reason: "Ban", status: 'active', at: new Date().toISOString() }];
    writeCollection('watchlist', seed);
    return seed;
  }
  return list;
}
export function listWatchlist(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWatchlist(input, actor = 'system') {
  const row = {
    id: `wtl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Alert Person",
    reason: input.reason !== undefined ? input.reason : "Ban",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('watchlist', row, 300);
  appendAudit({ actor, action: 'watchlist.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateWatchlist(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('watchlist', list);
  appendAudit({ actor, action: 'watchlist.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function watchlistSummary() {
  const list = listWatchlist();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    cleared: list.filter((x) => x.status === 'cleared').length,
    expired: list.filter((x) => x.status === 'expired').length, watchlist: list };
}
