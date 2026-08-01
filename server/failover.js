/**
 * AŞAMA 341 — Failover.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('failover', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fov_1', pair: "EG-01/02",
      reason: "link loss", status: 'standby', at: new Date().toISOString() }];
    writeCollection('failover', seed);
    return seed;
  }
  return list;
}
export function listFailover(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFailover(input, actor = 'system') {
  const row = {
    id: `fov_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pair: input.pair !== undefined ? input.pair : "EG-01/02",
    reason: input.reason !== undefined ? input.reason : "link loss",
    status: input.status || 'standby',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('failover', row, 300);
  appendAudit({
    actor,
    action: 'failover.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFailover(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('failover', list);
  appendAudit({ actor, action: 'failover.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function failoverSummary() {
  const list = listFailover();
  return { total: list.length, standby: list.filter((x) => x.status === 'standby').length,
    active: list.filter((x) => x.status === 'active').length,
    failback: list.filter((x) => x.status === 'failback').length, failover: list };
}
