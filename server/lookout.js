/**
 * AŞAMA 411 — Lookout.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('lookout', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lko_1', point: "Sunset Rock",
      visitors: "14", status: 'open', at: new Date().toISOString() }];
    writeCollection('lookout', seed);
    return seed;
  }
  return list;
}
export function listLookout(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLookout(input, actor = 'system') {
  const row = {
    id: `lko_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    point: input.point !== undefined ? input.point : "Sunset Rock",
    visitors: input.visitors !== undefined ? Number(input.visitors) || 0 : 14,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lookout', row, 300);
  appendAudit({
    actor,
    action: 'lookout.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLookout(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lookout', list);
  appendAudit({ actor, action: 'lookout.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function lookoutSummary() {
  const list = listLookout();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    crowded: list.filter((x) => x.status === 'crowded').length,
    closed: list.filter((x) => x.status === 'closed').length, lookout: list };
}
