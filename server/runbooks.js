/**
 * AŞAMA 157 — Runbook.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('runbooks', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rbk_1', name: "Gate failover",
      owner: "CHIMERA", status: 'current', at: new Date().toISOString() }];
    writeCollection('runbooks', seed);
    return seed;
  }
  return list;
}
export function listRunbooks(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRunbooks(input, actor = 'system') {
  const row = {
    id: `rbk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Gate failover",
    owner: input.owner !== undefined ? input.owner : "CHIMERA",
    status: input.status || 'current',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('runbooks', row, 300);
  appendAudit({ actor, action: 'runbooks.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateRunbooks(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('runbooks', list);
  appendAudit({ actor, action: 'runbooks.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function runbooksSummary() {
  const list = listRunbooks();
  return { total: list.length, current: list.filter((x) => x.status === 'current').length,
    review: list.filter((x) => x.status === 'review').length,
    retired: list.filter((x) => x.status === 'retired').length, runbooks: list };
}
