/**
 * AŞAMA 801 — Metrics Lab.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('metricslab', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'met_1', metric: "Alpha",
      value: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('metricslab', seed);
    return seed;
  }
  return list;
}
export function listMetricslab(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMetricslab(input, actor = 'system') {
  const row = {
    id: `met_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "Alpha",
    value: input.value !== undefined ? Number(input.value) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('metricslab', row, 300);
  appendAudit({
    actor,
    action: 'metricslab.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMetricslab(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('metricslab', list);
  appendAudit({ actor, action: 'metricslab.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function metricslabSummary() {
  const list = listMetricslab();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, metricslab: list };
}
