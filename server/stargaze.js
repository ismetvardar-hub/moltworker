/**
 * AŞAMA 418 — Yıldız İzleme.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('stargaze', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'stg_1', spot: "Deck West",
      sky: "Clear", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('stargaze', seed);
    return seed;
  }
  return list;
}
export function listStargaze(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStargaze(input, actor = 'system') {
  const row = {
    id: `stg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    spot: input.spot !== undefined ? input.spot : "Deck West",
    sky: input.sky !== undefined ? input.sky : "Clear",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('stargaze', row, 300);
  appendAudit({
    actor,
    action: 'stargaze.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStargaze(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('stargaze', list);
  appendAudit({ actor, action: 'stargaze.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function stargazeSummary() {
  const list = listStargaze();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    live: list.filter((x) => x.status === 'live').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length, stargaze: list };
}
