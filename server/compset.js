/**
 * AŞAMA 381 — Comp Set.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('compset', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cps_1', competitor: "Rival Beach",
      rate: "2100", status: 'tracked', at: new Date().toISOString() }];
    writeCollection('compset', seed);
    return seed;
  }
  return list;
}
export function listCompset(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCompset(input, actor = 'system') {
  const row = {
    id: `cps_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    competitor: input.competitor !== undefined ? input.competitor : "Rival Beach",
    rate: input.rate !== undefined ? Number(input.rate) || 0 : 2100,
    status: input.status || 'tracked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('compset', row, 300);
  appendAudit({
    actor,
    action: 'compset.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCompset(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('compset', list);
  appendAudit({ actor, action: 'compset.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function compsetSummary() {
  const list = listCompset();
  return { total: list.length, tracked: list.filter((x) => x.status === 'tracked').length,
    outlier: list.filter((x) => x.status === 'outlier').length, compset: list };
}
