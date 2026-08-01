/**
 * AŞAMA 406 — Gelgit İzleme.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tidewatch', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tdw_1', spot: "Beach North",
      levelCm: "42", status: 'rising', at: new Date().toISOString() }];
    writeCollection('tidewatch', seed);
    return seed;
  }
  return list;
}
export function listTidewatch(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTidewatch(input, actor = 'system') {
  const row = {
    id: `tdw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    spot: input.spot !== undefined ? input.spot : "Beach North",
    levelCm: input.levelCm !== undefined ? Number(input.levelCm) || 0 : 42,
    status: input.status || 'rising',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tidewatch', row, 300);
  appendAudit({
    actor,
    action: 'tidewatch.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTidewatch(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tidewatch', list);
  appendAudit({ actor, action: 'tidewatch.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tidewatchSummary() {
  const list = listTidewatch();
  return { total: list.length, rising: list.filter((x) => x.status === 'rising').length,
    high: list.filter((x) => x.status === 'high').length,
    falling: list.filter((x) => x.status === 'falling').length,
    low: list.filter((x) => x.status === 'low').length, tidewatch: list };
}
