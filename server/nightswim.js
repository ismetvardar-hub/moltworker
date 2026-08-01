/**
 * AŞAMA 417 — Gece Yüzme.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('nightswim', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nsw_1', lane: "Pool-1",
      guestName: "Misafir", status: 'allowed', at: new Date().toISOString() }];
    writeCollection('nightswim', seed);
    return seed;
  }
  return list;
}
export function listNightswim(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNightswim(input, actor = 'system') {
  const row = {
    id: `nsw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    lane: input.lane !== undefined ? input.lane : "Pool-1",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'allowed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nightswim', row, 300);
  appendAudit({
    actor,
    action: 'nightswim.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNightswim(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('nightswim', list);
  appendAudit({ actor, action: 'nightswim.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function nightswimSummary() {
  const list = listNightswim();
  return { total: list.length, allowed: list.filter((x) => x.status === 'allowed').length,
    active: list.filter((x) => x.status === 'active').length,
    ended: list.filter((x) => x.status === 'ended').length, nightswim: list };
}
