/**
 * AŞAMA 775 — Observe Map.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('observemap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'obs_1', service: "Alpha",
      slo: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('observemap', seed);
    return seed;
  }
  return list;
}
export function listObservemap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createObservemap(input, actor = 'system') {
  const row = {
    id: `obs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "Alpha",
    slo: input.slo !== undefined ? input.slo : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('observemap', row, 300);
  appendAudit({
    actor,
    action: 'observemap.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateObservemap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('observemap', list);
  appendAudit({ actor, action: 'observemap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function observemapSummary() {
  const list = listObservemap();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, observemap: list };
}
