/**
 * AŞAMA 314 — Drift Monitor.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('driftmonitor', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'drf_1', model: "vision-ranker",
      delta: "0.08", status: 'stable', at: new Date().toISOString() }];
    writeCollection('driftmonitor', seed);
    return seed;
  }
  return list;
}
export function listDriftmonitor(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDriftmonitor(input, actor = 'system') {
  const row = {
    id: `drf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    model: input.model !== undefined ? input.model : "vision-ranker",
    delta: input.delta !== undefined ? Number(input.delta) || 0 : 0.08,
    status: input.status || 'stable',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('driftmonitor', row, 300);
  appendAudit({ actor, action: 'driftmonitor.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateDriftmonitor(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('driftmonitor', list);
  appendAudit({ actor, action: 'driftmonitor.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function driftmonitorSummary() {
  const list = listDriftmonitor();
  return { total: list.length, stable: list.filter((x) => x.status === 'stable').length,
    drift: list.filter((x) => x.status === 'drift').length,
    retrain: list.filter((x) => x.status === 'retrain').length, driftmonitor: list };
}
