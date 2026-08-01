/**
 * AŞAMA 597 — Pickup Drop.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pickupdrop', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pkd_1', slot: "14:00",
      door: "Lobby", status: 'open', at: new Date().toISOString() }];
    writeCollection('pickupdrop', seed);
    return seed;
  }
  return list;
}
export function listPickupdrop(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPickupdrop(input, actor = 'system') {
  const row = {
    id: `pkd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slot: input.slot !== undefined ? input.slot : "14:00",
    door: input.door !== undefined ? input.door : "Lobby",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pickupdrop', row, 300);
  appendAudit({
    actor,
    action: 'pickupdrop.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePickupdrop(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pickupdrop', list);
  appendAudit({ actor, action: 'pickupdrop.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pickupdropSummary() {
  const list = listPickupdrop();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    busy: list.filter((x) => x.status === 'busy').length,
    closed: list.filter((x) => x.status === 'closed').length, pickupdrop: list };
}
