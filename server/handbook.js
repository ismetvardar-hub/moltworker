/**
 * AŞAMA 266 — El Kitabı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('handbook', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hbk_1', employee: "Ali",
      version: "2026.1", status: 'pending', at: new Date().toISOString() }];
    writeCollection('handbook', seed);
    return seed;
  }
  return list;
}
export function listHandbook(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHandbook(input, actor = 'system') {
  const row = {
    id: `hbk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ali",
    version: input.version !== undefined ? input.version : "2026.1",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('handbook', row, 300);
  appendAudit({ actor, action: 'handbook.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateHandbook(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('handbook', list);
  appendAudit({ actor, action: 'handbook.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function handbookSummary() {
  const list = listHandbook();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    acked: list.filter((x) => x.status === 'acked').length, handbook: list };
}
