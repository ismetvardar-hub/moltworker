/**
 * AŞAMA 1039 — Failover.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('failover3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fai_1', system: "Alpha",
      result: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('failover3', seed);
    return seed;
  }
  return list;
}
export function listFailover3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFailover3(input, actor = 'system') {
  const row = {
    id: `fai_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    system: input.system !== undefined ? input.system : "Alpha",
    result: input.result !== undefined ? input.result : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('failover3', row, 300);
  appendAudit({
    actor,
    action: 'failover3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFailover3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('failover3', list);
  appendAudit({ actor, action: 'failover3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function failover3Summary() {
  const list = listFailover3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, failover3: list };
}
