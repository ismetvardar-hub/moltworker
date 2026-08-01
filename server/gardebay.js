/**
 * AŞAMA 454 — Garde Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('gardebay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'grd_1', bay: "Cold-1",
      prep: "Crudo", status: 'open', at: new Date().toISOString() }];
    writeCollection('gardebay', seed);
    return seed;
  }
  return list;
}
export function listGardebay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGardebay(input, actor = 'system') {
  const row = {
    id: `grd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "Cold-1",
    prep: input.prep !== undefined ? input.prep : "Crudo",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('gardebay', row, 300);
  appendAudit({
    actor,
    action: 'gardebay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGardebay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('gardebay', list);
  appendAudit({ actor, action: 'gardebay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function gardebaySummary() {
  const list = listGardebay();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    busy: list.filter((x) => x.status === 'busy').length,
    closed: list.filter((x) => x.status === 'closed').length, gardebay: list };
}
