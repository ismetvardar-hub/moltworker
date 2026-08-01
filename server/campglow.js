/**
 * AŞAMA 410 — Camp Glow.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('campglow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cgw_1', pit: "Fire-1",
      fuel: "OK", status: 'ready', at: new Date().toISOString() }];
    writeCollection('campglow', seed);
    return seed;
  }
  return list;
}
export function listCampglow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCampglow(input, actor = 'system') {
  const row = {
    id: `cgw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pit: input.pit !== undefined ? input.pit : "Fire-1",
    fuel: input.fuel !== undefined ? input.fuel : "OK",
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('campglow', row, 300);
  appendAudit({
    actor,
    action: 'campglow.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCampglow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('campglow', list);
  appendAudit({ actor, action: 'campglow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function campglowSummary() {
  const list = listCampglow();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    lit: list.filter((x) => x.status === 'lit').length,
    cold: list.filter((x) => x.status === 'cold').length, campglow: list };
}
