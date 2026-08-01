/**
 * AŞAMA 388 — Marj İzleme.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('marginwatch', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mgw_1', sku: "Cocktail",
      margin: "54", status: 'healthy', at: new Date().toISOString() }];
    writeCollection('marginwatch', seed);
    return seed;
  }
  return list;
}
export function listMarginwatch(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMarginwatch(input, actor = 'system') {
  const row = {
    id: `mgw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Cocktail",
    margin: input.margin !== undefined ? Number(input.margin) || 0 : 54,
    status: input.status || 'healthy',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('marginwatch', row, 300);
  appendAudit({
    actor,
    action: 'marginwatch.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMarginwatch(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('marginwatch', list);
  appendAudit({ actor, action: 'marginwatch.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function marginwatchSummary() {
  const list = listMarginwatch();
  return { total: list.length, healthy: list.filter((x) => x.status === 'healthy').length,
    thin: list.filter((x) => x.status === 'thin').length,
    negative: list.filter((x) => x.status === 'negative').length, marginwatch: list };
}
