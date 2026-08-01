/**
 * AŞAMA 669 — Live Cast.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('livecast', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lvc_1', show: "Sunset session",
      platform: "IG", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('livecast', seed);
    return seed;
  }
  return list;
}
export function listLivecast(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLivecast(input, actor = 'system') {
  const row = {
    id: `lvc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    show: input.show !== undefined ? input.show : "Sunset session",
    platform: input.platform !== undefined ? input.platform : "IG",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('livecast', row, 300);
  appendAudit({
    actor,
    action: 'livecast.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLivecast(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('livecast', list);
  appendAudit({ actor, action: 'livecast.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function livecastSummary() {
  const list = listLivecast();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    live: list.filter((x) => x.status === 'live').length,
    ended: list.filter((x) => x.status === 'ended').length, livecast: list };
}
