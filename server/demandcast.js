/**
 * AŞAMA 536 — Demand Cast.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('demandcast', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dmc_1', metric: "Occupancy",
      value: "86", status: 'draft', at: new Date().toISOString() }];
    writeCollection('demandcast', seed);
    return seed;
  }
  return list;
}
export function listDemandcast(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDemandcast(input, actor = 'system') {
  const row = {
    id: `dmc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "Occupancy",
    value: input.value !== undefined ? Number(input.value) || 0 : 86,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('demandcast', row, 300);
  appendAudit({
    actor,
    action: 'demandcast.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDemandcast(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('demandcast', list);
  appendAudit({ actor, action: 'demandcast.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function demandcastSummary() {
  const list = listDemandcast();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    miss: list.filter((x) => x.status === 'miss').length, demandcast: list };
}
