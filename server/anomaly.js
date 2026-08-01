/**
 * AŞAMA 535 — Anomaly.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('anomaly', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'anm_1', signal: "F&B waste",
      score: "0.82", status: 'open', at: new Date().toISOString() }];
    writeCollection('anomaly', seed);
    return seed;
  }
  return list;
}
export function listAnomaly(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAnomaly(input, actor = 'system') {
  const row = {
    id: `anm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    signal: input.signal !== undefined ? input.signal : "F&B waste",
    score: input.score !== undefined ? Number(input.score) || 0 : 0.82,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('anomaly', row, 300);
  appendAudit({
    actor,
    action: 'anomaly.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAnomaly(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('anomaly', list);
  appendAudit({ actor, action: 'anomaly.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function anomalySummary() {
  const list = listAnomaly();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    ack: list.filter((x) => x.status === 'ack').length,
    resolved: list.filter((x) => x.status === 'resolved').length, anomaly: list };
}
