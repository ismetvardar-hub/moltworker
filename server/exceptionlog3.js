/**
 * AŞAMA 1091 — Exception Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('exceptionlog3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'exc_1', code: "Alpha",
      note: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('exceptionlog3', seed);
    return seed;
  }
  return list;
}
export function listExceptionlog3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createExceptionlog3(input, actor = 'system') {
  const row = {
    id: `exc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : "Alpha",
    note: input.note !== undefined ? input.note : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('exceptionlog3', row, 300);
  appendAudit({
    actor,
    action: 'exceptionlog3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateExceptionlog3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('exceptionlog3', list);
  appendAudit({ actor, action: 'exceptionlog3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function exceptionlog3Summary() {
  const list = listExceptionlog3();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, exceptionlog3: list };
}
