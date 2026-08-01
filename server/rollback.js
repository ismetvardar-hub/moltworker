/**
 * AŞAMA 779 — Rollback.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('rollback', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rol_1', service: "Alpha",
      version: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('rollback', seed);
    return seed;
  }
  return list;
}
export function listRollback(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRollback(input, actor = 'system') {
  const row = {
    id: `rol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('rollback', row, 300);
  appendAudit({
    actor,
    action: 'rollback.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRollback(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('rollback', list);
  appendAudit({ actor, action: 'rollback.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function rollbackSummary() {
  const list = listRollback();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, rollback: list };
}
