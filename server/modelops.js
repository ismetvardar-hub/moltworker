/**
 * AŞAMA 301 — Model Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('modelops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mop_1', model: "llama3.1",
      version: "8b", status: 'staging', at: new Date().toISOString() }];
    writeCollection('modelops', seed);
    return seed;
  }
  return list;
}
export function listModelops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createModelops(input, actor = 'system') {
  const row = {
    id: `mop_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    model: input.model !== undefined ? input.model : "llama3.1",
    version: input.version !== undefined ? input.version : "8b",
    status: input.status || 'staging',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('modelops', row, 300);
  appendAudit({ actor, action: 'modelops.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateModelops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('modelops', list);
  appendAudit({ actor, action: 'modelops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function modelopsSummary() {
  const list = listModelops();
  return { total: list.length, staging: list.filter((x) => x.status === 'staging').length,
    prod: list.filter((x) => x.status === 'prod').length,
    retired: list.filter((x) => x.status === 'retired').length, modelops: list };
}
