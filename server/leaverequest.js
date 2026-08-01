/**
 * AŞAMA 262 — İzin Talebi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('leaverequest', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lvr_1', employee: "Ayşe",
      days: "3", status: 'requested', at: new Date().toISOString() }];
    writeCollection('leaverequest', seed);
    return seed;
  }
  return list;
}
export function listLeaverequest(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLeaverequest(input, actor = 'system') {
  const row = {
    id: `lvr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ayşe",
    days: input.days !== undefined ? Number(input.days) || 0 : 3,
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('leaverequest', row, 300);
  appendAudit({ actor, action: 'leaverequest.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateLeaverequest(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('leaverequest', list);
  appendAudit({ actor, action: 'leaverequest.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function leaverequestSummary() {
  const list = listLeaverequest();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length, leaverequest: list };
}
