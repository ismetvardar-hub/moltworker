/**
 * AŞAMA 1011 — Metrics Lab.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('metricslab2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'met_1', metric: "Alpha",
      value: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('metricslab2', seed);
    return seed;
  }
  return list;
}
export function listMetricslab2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMetricslab2(input, actor = 'system') {
  const row = {
    id: `met_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "Alpha",
    value: input.value !== undefined ? Number(input.value) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('metricslab2', row, 300);
  appendAudit({
    actor,
    action: 'metricslab2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMetricslab2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('metricslab2', list);
  appendAudit({ actor, action: 'metricslab2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function metricslab2Summary() {
  const list = listMetricslab2();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, metricslab2: list };
}
